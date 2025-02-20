import nltk
from datetime import datetime
from dateutil import parser
import re

nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')

def extract_actions(text):
    sentences = nltk.sent_tokenize(text)
    actions = {
        'tasks': [],
        'dates': [],
        'key_points': []
    }

    for sentence in sentences:
        # Extract tasks (sentences starting with action verbs)
        words = nltk.word_tokenize(sentence)
        tags = nltk.pos_tag(words)
        if tags and tags[0][1].startswith('VB'):
            actions['tasks'].append(sentence)

        # Extract dates
        try:
            found_dates = parser.parse(sentence, fuzzy=True)
            if found_dates:
                actions['dates'].append({
                    'text': sentence,
                    'date': found_dates.strftime("%Y-%m-%d %H:%M")
                })
        except:
            pass

        # Extract key points (sentences with important keywords)
        keywords = ['important', 'key', 'critical', 'essential', 'priority']
        if any(keyword in sentence.lower() for keyword in keywords):
            actions['key_points'].append(sentence)

    return actions

def generate_tasks(actions):
    tasks = []
    
    # Generate calendar events from dates
    for date_item in actions['dates']:
        tasks.append({
            'type': 'calendar',
            'title': date_item['text'][:50] + '...',
            'datetime': date_item['date']
        })

    # Generate todo items from tasks
    for task in actions['tasks']:
        tasks.append({
            'type': 'todo',
            'description': task,
            'deadline': None  # Could be enhanced to extract deadlines from task text
        })

    return tasks