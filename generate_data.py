import pandas as pd
import numpy as np

# Column names gathered from the dataset images
headers = [
    "Discrete Queue Name", "ProducerName", "ConsumerName", "Primary App_Full_Name",
    "queue_manager_name", "app_id", "line_of_business", "cluster_name", "cluster_namelist",
    "def_persistence", "def_put_response", "inhibit_get", "inhibit_put", "remote_q_mgr_name",
    "PrimaryAppDisp", "PrimaryAppRole", "q_type", "Primary Neighborhood", "Primary Hosting Type",
    "Primary Enterprise Critical Payment", "Primary PCI", "Primary Publicly Accessible", "Primary TRTC"
]

# Generate synthetic data mimicking the images
qms = ["WL6EX2C", "WQ26", "WL6ER2D", "DC6Z098V", "WL6ESPM", "WO30", "WL6ER4D"]
apps = ["8A", "OK", "PPCSM", "8AFK", "8ASE", "8FVC", "8SOR", "9SDC"]
lobs = ["TECHCT", "TECHCCIBT", "TECHCOO", "TECHEFT"]

rows = []
for i in range(100):
    qm = np.random.choice(qms)
    # Ensure some connectivity
    remote_qm = np.random.choice(qms) if np.random.rand() > 0.4 else ""
    if remote_qm == qm: remote_qm = ""
    
    row = {
        "Discrete Queue Name": f"{np.random.choice(apps)}.QUEUE.{i:03d}",
        "ProducerName": f"Producer_{np.random.choice(apps)}",
        "ConsumerName": f"Consumer_{np.random.choice(apps)}",
        "Primary App_Full_Name": f"App_Full_{i}",
        "queue_manager_name": qm,
        "app_id": np.random.choice(apps),
        "line_of_business": np.random.choice(lobs),
        "cluster_name": "CLUS1" if np.random.rand() > 0.7 else "",
        "cluster_namelist": "",
        "def_persistence": np.random.choice(["Yes", "No"]),
        "def_put_response": "Synchronous",
        "inhibit_get": np.random.choice(["Enabled", "Disabled"]),
        "inhibit_put": "Enabled",
        "remote_q_mgr_name": remote_qm,
        "PrimaryAppDisp": "Full App Retire" if np.random.rand() > 0.8 else "Active",
        "PrimaryAppRole": np.random.choice(["Producer", "Consumer"]),
        "q_type": np.random.choice(["Local", "Remote", "Alias"]),
        "Primary Neighborhood": np.random.choice(["Wholesale Banking", "Retail Banking", "Core Banking"]),
        "Primary Hosting Type": "Internal",
        "Primary Enterprise Critical Payment": np.random.choice(["Yes", "No"]),
        "Primary PCI": np.random.choice(["Yes", "No"]),
        "Primary Publicly Accessible": "No",
        "Primary TRTC": "03= 4:01 to 11:59 Hours"
    }
    rows.append(row)

df = pd.DataFrame(rows)
df.to_csv("C:/Users/Damodar/.gemini/antigravity/scratch/mq_topology_analysis/MQ.Raw.Data.cleaned_v002.csv", index=False)
print("Synthetic CSV created successfully.")
