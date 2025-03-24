# with open('GBIF_lionfish_output.tsv', 'r') as input_file:
#     with open('GBIF_lionfish_output.csv', 'w') as output_file:
#         for line in input_file:
#             columns = line.strip().split('\t')
#             output_file.write(','.join(columns + '\n'))

# import pandas as pd
#
# # Read the TSV file
# df = pd.read_csv("GBIF_lionfish.csv", sep='\t')
#
# # Drop the 'issues' column
# df = df.drop(columns=['issue'])
#
# # Save as a CSV file without the index column
# df.to_csv("GBIF_lionfish_clean.csv", index=False)
#
# print("Conversion completed: GBIF_lionfish_clean.csv")

import pandas as pd

# Input and output filenames
input_file = "GBIF_lionfish_clean.csv"
output_file = "GBIF_lionfish_filtered.csv"

# Read the existing clean CSV
df = pd.read_csv(input_file)

# Strip column names just in case
df.columns = df.columns.str.strip()

# Drop rows with nulls in critical columns
df = df.dropna(subset=['year', 'decimalLatitude', 'decimalLongitude'])

# Save to new CSV
df.to_csv(output_file, index=False)

print(f"Filtered CSV saved as: {output_file}")
