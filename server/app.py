from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pickle
import os
import re
import string
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Path to the model file (assuming .pkl file is in the model folder)
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'fake_news_model.pkl')
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), 'model', 'tfidf_vectorizer.pkl')

# Load the model and vectorizer
try:
    model = pickle.load(open(MODEL_PATH, 'rb'))
    vectorizer = pickle.load(open(VECTORIZER_PATH, 'rb'))
    print("Model and vectorizer loaded successfully")
except Exception as e:
    print(f"Error loading model or vectorizer: {e}")
    model = None
    vectorizer = None

# Initialize Sastrawi stemmer and stopword remover
stemmer_factory = StemmerFactory()
stemmer = stemmer_factory.create_stemmer()

stopword_factory = StopWordRemoverFactory()
stopword_remover = stopword_factory.create_stop_word_remover()

def preprocess_text(text):
    """
    Preprocess the text for classification:
    - Convert to lowercase
    - Remove URLs, mentions, hashtags
    - Remove punctuation
    - Remove stopwords
    - Stemming
    """
    # Convert to lowercase
    text = text.lower()
    
    # Remove URLs
    text = re.sub(r'http\S+', '', text)
    
    # Remove mentions and hashtags
    text = re.sub(r'@\w+', '', text)
    text = re.sub(r'#\w+', '', text)
    
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    
    # Remove numbers
    text = re.sub(r'\d+', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Remove stopwords
    text = stopword_remover.remove(text)
    
    # Stemming
    text = stemmer.stem(text)
    
    return text

def extract_article_text(url):
    """
    Extract the main article text from a news URL
    """
    try:
        # Send request with a proper user agent
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()  # Raise exception for 4XX/5XX responses
        
        # Parse the HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "header", "footer", "nav"]):
            script.extract()
        
        # Get the site domain for site-specific extraction
        domain = urlparse(url).netloc
        
        # Extract text based on common article containers
        article_text = ""
        
        # Check for common article containers
        article_tags = soup.select('article, .article, .post, .content, .news-content, .article-content, .entry-content, .post-content, main')
        
        if article_tags:
            # Use the first article tag found
            article_text = article_tags[0].get_text(separator=' ', strip=True)
        else:
            # Fallback: get all paragraph text
            paragraphs = soup.find_all('p')
            article_text = ' '.join([p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 50])
        
        # Clean the text
        article_text = re.sub(r'\s+', ' ', article_text).strip()
        
        return {
            'success': True,
            'text': article_text,
            'title': soup.title.string if soup.title else '',
            'url': url
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/predict', methods=['POST'])
def predict():
    if not model or not vectorizer:
        return jsonify({'error': 'Model or vectorizer not loaded properly'}), 500
    
    # Get the data from the request
    data = request.json
    
    # Check if URL or text is provided
    if 'url' in data and data['url']:
        # Extract text from URL
        extraction_result = extract_article_text(data['url'])
        
        if not extraction_result['success']:
            return jsonify({'error': f"Failed to extract text from URL: {extraction_result['error']}"}), 400
        
        text = extraction_result['text']
        title = extraction_result['title']
        
        # Include original information in result
        source_info = {
            'url': data['url'],
            'title': title,
            'extracted_length': len(text)
        }
    
    elif 'text' in data and data['text']:
        text = data['text']
        source_info = {'type': 'manual_input'}
    
    else:
        return jsonify({'error': 'No text or URL provided'}), 400
    
    # Preprocess the text
    preprocessed_text = preprocess_text(text)
    
    # Vectorize the preprocessed text
    text_vectorized = vectorizer.transform([preprocessed_text])
    
    # Make prediction
    prediction = model.predict(text_vectorized)[0]
    probability = model.predict_proba(text_vectorized)[0].tolist()
    
    # Prepare response
    result = {
        'prediction': int(prediction),
        'label': 'FAKE' if prediction == 1 else 'REAL',
        'probability': {
            'real': probability[0],
            'fake': probability[1]
        },
        'source_info': source_info,
        'text_preview': text[:200] + '...' if len(text) > 200 else text
    }
    
    return jsonify(result)

@app.route('/info', methods=['GET'])
def info():
    """Provide information about the model"""
    if not model:
        return jsonify({'error': 'Model not loaded properly'}), 500
    
    model_info = {
        'model_type': type(model).__name__,
        'vectorizer_type': type(vectorizer).__name__,
        'features': vectorizer.get_feature_names_out().tolist()[:10] + ['...'],  # First 10 features
        'feature_count': len(vectorizer.get_feature_names_out())
    }
    
    return jsonify(model_info)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)