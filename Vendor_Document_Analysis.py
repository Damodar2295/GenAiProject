# ---
# jupyter:
#   jupytext:
#     text_representation:
#       extension: .py
#       format_name: light
#       format_version: '1.5'
#       jupytext_version: 1.16.4
#   kernelspec:
#     display_name: Python 3 (Local)
#     language: python
#     name: python3
# ---



# +
import os
import re
import warnings
import numpy as np
import pandas as pd
import textract
from PyPDF2 import PdfReader
from tenacity import retry, stop_after_attempt, wait_random_exponential
from vertexai.language_models import TextEmbeddingModel, TextGenerationModel
import tiktoken  # Token counting library for GPT-like models

warnings.filterwarnings("ignore")

# Load models
generation_model = TextGenerationModel.from_pretrained("text-bison@001")
embedding_model = TextEmbeddingModel.from_pretrained("textembedding-gecko@001")


# +
@retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(3))
def text_generation_model_with_backoff(**kwargs):
    return generation_model.predict(**kwargs).text


@retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(3))
def embedding_model_with_backoff(text=[]):
    embeddings = embedding_model.get_embeddings(text)
    return [each.values for each in embeddings][0]
# -



# +
import os
from PyPDF2 import PdfReader  # For searchable PDFs
import fitz  # For handling unsearchable PDFs
import textract  # For handling other file types
path = 'pocfiles'
def files(path):
    """
    Function that returns only filenames if the path is a directory,
    or returns the single file if the path is a file.
    """
    if os.path.isfile(path):
        # If it's a file, yield just that file
        yield path
    elif os.path.isdir(path):
        # If it's a directory, list all files
        for file in os.listdir(path):
            file_path = os.path.join(path, file)
            if os.path.isfile(file_path):
                yield file_path
    else:
        raise NotADirectoryError(f"{path} is neither a file nor a directory")
# Define create_data_packet if not already defined
def create_data_packet(file_name, file_type, page_number, file_content):
    return {
        'file_name': file_name,
        'file_type': file_type,
        'page_number': page_number,
        'file_content': file_content
    }

final_data = []

for file_name in files(path):
    print(file_name)
    _, file_type = os.path.splitext(file_name)
    
    if file_type == ".pdf":
        # Attempt to load and extract text using PdfReader (for searchable PDFs)
        reader = PdfReader(file_name)
        is_text_extracted = False
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                packet = create_data_packet(
                    file_name, file_type, page_number=int(i + 1), file_content=text
                )
                final_data.append(packet)
                is_text_extracted = True
        
        # If no text was extracted (likely an unsearchable PDF), use fitz (PyMuPDF)
        if not is_text_extracted:
            print(f"No text found with PdfReader, using fitz for {file_name}")
            doc = fitz.open(file_name)
            for i in range(doc.page_count):
                page = doc.load_page(i)
                text = page.get_text("text")  # Extract text
                if text.strip():  # Ensure non-empty text
                    packet = create_data_packet(
                        file_name, file_type, page_number=int(i + 1), file_content=text
                    )
                    final_data.append(packet)
                else:
                    # If page is still non-text, render page as image (optional)
                    pix = page.get_pixmap()
                    pix.save(f"page-{i + 1}-{file_name}.png")
                    print(f"Page {i + 1} rendered as image.")
    
    else:
        # For non-PDF file types, use textract
        text = textract.process(file_name).decode("utf-8")
        packet = create_data_packet(
            file_name, file_type, page_number=None, file_content=text
        )
        final_data.append(packet)
    
    # converting the data that has been read from GCS to Pandas DataFrame for easy readibility and downstream logic
    pdf_data = pd.DataFrame.from_dict(final_data)
    pdf_data = pdf_data.sort_values(by=["file_name", "page_number"])  # sorting the datafram by filename and page_number
    pdf_data.reset_index(inplace=True, drop=True)
    # you can check how many different file type you have in our datafrmae.
    # The function get_chunks_iter() can be used to split a piece of text into smaller chunks,
    # each of which is at most maxlength characters long.
    # This can be useful for tasks such as summarization, question answering, and translation.
    print("Data has these different file types : \n", pdf_data["file_type"].value_counts())
    # combining all the content of the PDF as single string such that it can be passed as context.
    context = "\n".join(str(v) for v in pdf_data["file_content"].values)
    print("The total words in the context: ", len(context))
    def get_chunks_iter(text, maxlength):
        """
        Get chunks of text, each of which is at most maxlength characters long.

        Args:
            text: The text to be chunked.
            maxlength: The maximum length of each chunk.

        Returns:
            An iterator over the chunks of text.
        """
        start = 0
        end = 0
        final_chunk = []
        while start + maxlength < len(text) and end != -1:
            end = text.rfind(" ", start, start + maxlength + 1)
            final_chunk.append(text[start:end])
            start = end + 1
        final_chunk.append(text[start:])
        return final_chunk


    # function to apply "get_chunks_iter" function on each row of dataframe.
    # currently each row here for file_type=pdf is content of each page and for other file_type its the whole document.
    def split_text(row):
        chunk_iter = get_chunks_iter(row, chunk_size)
        return chunk_iter
    global chunk_size
    # you can define how many words should be there in a given chunk.
    chunk_size = 5000

    pdf_data_sample = pdf_data.copy()
    # Token count function using tiktoken
    def count_tokens(prompt):
        # Use tiktoken to count tokens
        enc = tiktoken.get_encoding("p50k_base")  # Choose the appropriate encoding for your model
        tokens = enc.encode(prompt)
        return len(tokens)
        # Remove all non-alphabets and numbers from the data to clean it up.
    # This is harsh cleaning. You can define your custom logic for cleansing here.
    pdf_data_sample["file_content"] = pdf_data_sample["file_content"].apply(
        lambda x: re.sub("[^A-Za-z0-9]+", " ", x)
    )
    # Apply the chunk splitting logic here on each row of content in dataframe.
    pdf_data_sample["chunks"] = pdf_data_sample["file_content"].apply(split_text)
    # Now, each row in 'chunks' contains list of all chunks and hence we need to explode them into individual rows.
    pdf_data_sample = pdf_data_sample.explode("chunks")
        # Sort and reset index
    pdf_data_sample = pdf_data_sample.sort_values(by=["file_name", "page_number"])
    pdf_data_sample.reset_index(inplace=True, drop=True)
    print("The original dataframe has :", pdf_data.shape[0], " rows without chunking")
    print("The chunked dataframe has :", pdf_data_sample.shape[0], " rows with chunking")
    # function to pass in the apply function on dataframe to extract answer for specific question on each row.
        # Calculate embeddings for each chunk
    # Ensure chunks do not have missing values before applying the embeddings
    pdf_data_sample["chunks"] = pdf_data_sample["chunks"].fillna("")

    # Apply the embedding model to the chunks and store the embeddings
    def compute_embedding(chunk):
        try:
            return embedding_model_with_backoff([chunk])
        except Exception as e:
            print(f"Error computing embedding for chunk: {chunk}, Error: {e}")
            return None

    # Compute embeddings and store them in the DataFrame
    pdf_data_sample["embedding"] = pdf_data_sample["chunks"].apply(lambda x: compute_embedding(x))

    # Convert the embeddings into numpy arrays
    pdf_data_sample["embedding"] = pdf_data_sample["embedding"].apply(lambda x: np.array(x) if x is not None else None)

    # Check if the embedding column was created properly
    #print(pdf_data.head())
    def get_answer(df):
        prompt = f"""Answer the question as precise as possible using the provided context. If the answer is
                     not contained in the context, say "answer not available in context" \n\n
                      Context: \n {df['chunks']}?\n
                      Question: \n {question} \n
                      Answer:
                """

        pred = text_generation_model_with_backoff(prompt=prompt)
        return pred
    def get_dot_product(row):
        return np.dot(row, query_vector)


    def get_context_from_question(question, vector_store, sort_index_value=2):
        global query_vector
        query_vector = np.array(embedding_model_with_backoff([question]))
        top_matched = (
            vector_store["embedding"]
            .apply(get_dot_product)
            .sort_values(ascending=False)[:sort_index_value]
            .index
        )
        top_matched_df = vector_store[vector_store.index.isin(top_matched)][
            ["file_name", "page_number", "chunks"]
        ]
        context = " ".join(
            vector_store[vector_store.index.isin(top_matched)]["chunks"].values
        )
        return context, top_matched_df
    import json

    # Load the JSON data
    with open('prompt_questions.json') as f:
        data = json.load(f)
    # Process JSON data and generate answers
    TOKEN_LIMIT = 4000
    MAX_TOKENS_PER_REQUEST = 1000
    import json
    import pandas as pd
    # Load the JSON data
    with open('prompt_questions.json') as f:
        data = json.load(f)
    documentids = ['MG206855','MK231582','NY222079','SG222341']
    # Iterate through each question in the JSON
    #,'NY222079','SG222341'
    prompt_answers = []
    for document in documentids:
        for question_data in data['documentResponse'][0]['documentDetails']:
        # Construct prompt for each question
        # Fetch context based on the question
            context, top_matched_df = get_context_from_question(
                question, vector_store=pdf_data_sample, sort_index_value=5
            )
            question = question_data['question'] + f" For {document}"
            citationDetails = question_data['citationDetails']
            pageNumber = question_data['pageNumber']

            #esgType = question_data['esgType']
        #CompanyName = question_data['entityName']
       # context = "Provide your context here"  # Replace with your actual context
            prompt = f"""Answer the question with only to the point. If the answer is not contained in the context, say "NULL".

            Context:
            {context}?

            Question:
            {question}

            Answer:
            """


        # Pass the prompt to the language model and get the answer
        # Use your code to interact with the language model here
        # Replace the following line with your actual code
            generated_answer = "Generated answer for " + question
            # Handle token count issue
            if count_tokens(prompt) > TOKEN_LIMIT:
                # Break prompt into smaller chunks
                prompt_chunks = get_chunks_iter(prompt, maxlength=MAX_TOKENS_PER_REQUEST)
                for chunk in prompt_chunks:
                    generated_answer = generation_model.predict(chunk).text
            else:
                generated_answer = generation_model.predict(prompt).text
            prompt_answers.append({
                'Document': document,
                'Answer': generated_answer
            })

df = pd.DataFrame(prompt_answers)
pdf_data_sample.head()
df.head(50)
#pdf_data_sample_head.head(2)
    

# -


