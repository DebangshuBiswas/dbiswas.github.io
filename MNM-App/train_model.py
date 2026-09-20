import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import MinMaxScaler

# 1. Load the IBM HR Analytics Dataset
df = pd.read_csv("data/WA_Fn-UseC_-HR-Employee-Attrition.csv")

# 2. Map & Normalize Features to 0.0 - 1.0 scale
df['aptitude'] = df['Education'] / 5.0
df['technical'] = df['JobInvolvement'] / 4.0
df['interview'] = df['RelationshipSatisfaction'] / 4.0

# Continuity: Invert NumCompaniesWorked (Max in dataset is 9)
max_companies = df['NumCompaniesWorked'].max()
df['continuity'] = 1.0 - (df['NumCompaniesWorked'] / max_companies)

# Prestige Bias: Favor STEM fields historically
def map_tier(field):
    if field in ['Life Sciences', 'Medical']: return 1.0      # Tier 1
    elif field in ['Technical Degree', 'Marketing']: return 0.5 # Tier 2
    else: return 0.0                                            # Tier 3
df['college_tier'] = df['EducationField'].apply(map_tier)

# 3. Create the Target Variable (Historical Hiring Decisions)
# To simulate the bias required for the board game's STOP card, 
# we train the model on historical data that unfairly over-weighted 
# continuous employment and specific college degrees.
df['historical_hire'] = (
    (df['aptitude'] * 1.5) + 
    (df['technical'] * 2.0) + 
    (df['interview'] * 1.5) + 
    (df['continuity'] * 3.5) +  
    (df['college_tier'] * 4.0)
) > 8.5
df['historical_hire'] = df['historical_hire'].astype(int)

# 4. Train the Model
scaler = MinMaxScaler()
X = scaler.fit_transform(df[['aptitude', 'technical', 'interview', 'continuity', 'college_tier']])
y = df['historical_hire']

model = LogisticRegression(class_weight='balanced')
model.fit(X, y)

# 5. Output Weights for JavaScript
#print("=== COPY THIS INTO YOUR JAVASCRIPT ===")
print("const modelWeights = {")
print(f"    intercept: {model.intercept_[0]:.4f},")
print(f"    aptitude: {model.coef_[0][0]:.4f},")
print(f"    technical: {model.coef_[0][1]:.4f},")
print(f"    interview: {model.coef_[0][2]:.4f},")
print(f"    continuity: {model.coef_[0][3]:.4f},")
print(f"    college_tier: {model.coef_[0][4]:.4f}")
print("};")
print("======================================")