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
import glob
import os
import re
import warnings

import numpy as np
import pandas as pd
#import textract
from PyPDF2 import PdfReader
#from tenacity import retry, stop_after_attempt, wait_random_exponential
#from vertexai.language_models import TextEmbeddingModel, TextGenerationModel
warnings.filterwarnings("ignore")
import glob
import os
import re
import warnings

import numpy as np
import pandas as pd

# -

def create_data_packet(file_name, file_type, page_number, file_content):
    """Creating a simple dictionary to store all information (content and metadata)
    extracted from the document"""
    data_packet = {}
    data_packet["file_name"] = file_name
    data_packet["file_type"] = file_type
    data_packet["page_number"] = page_number
    data_packet["content"] = file_content
    return data_packet


path = 'pocfiles'
def files(path):
    """
    Function that returns only filenames (and not folder names)
    """
    for file in os.listdir(path):
        if os.path.isfile(os.path.join(path, file)):
            yield file


# +
import os
from PyPDF2 import PdfReader  # For searchable PDFs
import fitz  # For handling unsearchable PDFs
import textract  # For handling other file types

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

# Define create_data_packet if not already defined
def create_data_packet(file_name, file_type, page_number, file_content):
    return {
        'file_name': file_name,
        'file_type': file_type,
        'page_number': page_number,
        'file_content': file_content
    }


# -

# converting the data that has been read from GCS to Pandas DataFrame for easy readibility and downstream logic
pdf_data = pd.DataFrame.from_dict(final_data)
pdf_data = pdf_data.sort_values(
    by=["file_name", "page_number"]
)  # sorting the datafram by filename and page_number
pdf_data.reset_index(inplace=True, drop=True)
pdf_data.head()

# you can check how many different file type you have in our datafrmae.
print("Data has these different file types : \n", pdf_data["file_type"].value_counts())
# combining all the content of the PDF as single string such that it can be passed as context.
context = "\n".join(str(v) for v in pdf_data["content"].values)
print("The total words in the context: ", len(context))


