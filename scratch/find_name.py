import glob
import re

for fname in glob.glob("**/*.py", recursive=True):
    with open(fname, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
    for idx, line in enumerate(lines):
        if "name" in line:
            # check if there's any single-character slice or something suspicious
            if any(term in line for term in ["name[0]", "name[:", "parsed[", "raw_extracted", "val_name"]):
                print(f"{fname}:{idx+1}: {line.strip()}")
