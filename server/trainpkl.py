import pandas as pd
import numpy as np
import pickle
import re
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression


# Pastikan folder model ada
model_folder = "model"
if not os.path.exists(model_folder):
    os.makedirs(model_folder)

# Load dataset
data_path = os.path.join(os.getcwd(), "..", "data", "Data_latih.csv") # Pastikan path benar
df = pd.read_csv(data_path)

# Pastikan dataset memiliki kolom yang dibutuhkan
if not {"judul", "narasi", "label"}.issubset(df.columns):
    raise ValueError("Dataset harus memiliki kolom: judul, narasi, label")

# Preprocessing function
def clean_text(text):
    if pd.isna(text) or text == '':
        return ''
    text = text.lower()  # Lowercase
    text = re.sub(r'\W', ' ', text)  # Remove special characters
    text = re.sub(r'\s+', ' ', text).strip()  # Remove extra spaces
    return text

# Menggabungkan judul dan narasi, lalu membersihkan teks
df['text'] = (df['judul'] + " " + df['narasi']).apply(clean_text)

# Memisahkan fitur dan label
X = df['text']
y = df['label']

# Membagi data menjadi train dan test set (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# TF-IDF Vectorizer
tfidf_vectorizer = TfidfVectorizer(max_features=5000)
X_train_tfidf = tfidf_vectorizer.fit_transform(X_train)
X_test_tfidf = tfidf_vectorizer.transform(X_test)

# Melatih model dengan Logistic Regression
model = LogisticRegression(max_iter=1000)
model.fit(X_train_tfidf, y_train)

# Evaluasi akurasi
train_score = model.score(X_train_tfidf, y_train)
test_score = model.score(X_test_tfidf, y_test)

print(f"Akurasi Training: {train_score:.2%}")
print(f"Akurasi Testing: {test_score:.2%}")

# Simpan model dan vectorizer
model_path = os.path.join(model_folder, "fake_news_model.pkl")
vectorizer_path = os.path.join(model_folder, "tfidf_vectorizer.pkl")

with open(model_path, "wb") as model_file:
    pickle.dump(model, model_file)

with open(vectorizer_path, "wb") as vectorizer_file:
    pickle.dump(tfidf_vectorizer, vectorizer_file)

print(f"Model berhasil disimpan di {model_path}")
print(f"Vectorizer berhasil disimpan di {vectorizer_path}")
