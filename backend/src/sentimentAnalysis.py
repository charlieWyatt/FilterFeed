# import sentiment analysis
import sqlite3
import json

from transformers import pipeline
sentiment_pipeline = pipeline("sentiment-analysis") # Should specify a model name in production. But for testing, this is fine

def transcript_sentiment_score(transcript):
    if not transcript:
        return None
    
    sentences = []
    for sentence in transcript:
        sentences.append(sentence['text'])
    print(sentences) # I think putting everything on one line is too long for sentiment analysis
    sentiment_score = sentiment_pipeline(sentences)
    summary_of_scores = {"POSITIVE": 0, "NEUTRAL": 0, "NEGATIVE": 0, "NUM_POSITIVE": 0, "NUM_NEUTRAL": 0, "NUM_NEGATIVE": 0, "NUM_UNKNOWN": 0}
    for scores in sentiment_score:
        if scores['label'] == "POSITIVE":
            summary_of_scores['NUM_POSITIVE'] += 1
            summary_of_scores['POSITIVE'] += scores['score']
        elif scores['label'] == "NEUTRAL":
            summary_of_scores['NUM_NEUTRAL'] += 1
            summary_of_scores['NEUTRAL'] += scores['score']
        elif scores['label'] == "NEGATIVE":
            summary_of_scores['NUM_NEGATIVE'] += 1
            summary_of_scores['NEGATIVE'] += scores['score']
        else:
            summary_of_scores['NUM_UNKNOWN'] += 1
    final_score = (summary_of_scores['POSITIVE'] - summary_of_scores['NEGATIVE']) / (summary_of_scores["NUM_POSITIVE"] + summary_of_scores["NUM_NEGATIVE"])
    return final_score

# # Get a transcript
# sqliteConnection = sqlite3.connect('./database.db')
# cursor = sqliteConnection.cursor()
# cursor.execute("SELECT * FROM all_videos;")

# rows = cursor.fetchall()
# test_row = 2

# i = 0
# while i < len(rows[test_row]):
#     if i != 14:
#         print(rows[test_row][i])
#     i+=1

# test_transcript = json.loads(rows[test_row][14])
# sentences = []
# for sentence in test_transcript:
#     sentences.append(sentence['text'])
# print(sentences) # I think putting everything on one line is too long for sentiment analysis
# sentiment_score = sentiment_pipeline(sentences)
# summary_of_scores = {"POSITIVE": 0, "NEUTRAL": 0, "NEGATIVE": 0, "NUM_POSITIVE": 0, "NUM_NEUTRAL": 0, "NUM_NEGATIVE": 0, "NUM_UNKNOWN": 0}
# for scores in sentiment_score:
#     if scores['label'] == "POSITIVE":
#         summary_of_scores['NUM_POSITIVE'] += 1
#         summary_of_scores['POSITIVE'] += scores['score']
#     elif scores['label'] == "NEUTRAL":
#         summary_of_scores['NUM_NEUTRAL'] += 1
#         summary_of_scores['NEUTRAL'] += scores['score']
#     elif scores['label'] == "NEGATIVE":
#         summary_of_scores['NUM_NEGATIVE'] += 1
#         summary_of_scores['NEGATIVE'] += scores['score']
#     else:
#         summary_of_scores['NUM_UNKNOWN'] += 1

# # # I SHOULDN'T JUST TAKE THE AVERAGE, SINCE THAT DOESNT TAKE INTO ACCOUNT THE NUMBER OF POSITIVE / NEGATIVE
# # # A CUMULATIVE SUM COULD WORK AS A PLACEHOLDER
# # if summary_of_scores['NUM_POSITIVE'] != 0:
# #     summary_of_scores['POSITIVE'] = summary_of_scores['POSITIVE']/ summary_of_scores['NUM_POSITIVE']
# # if summary_of_scores['NUM_NEUTRAL'] != 0:
# #     summary_of_scores['NEUTRAL'] = summary_of_scores['NEUTRAL']/ summary_of_scores['NUM_NEUTRAL']
# # if summary_of_scores['NUM_NEGATIVE'] != 0:
# #     summary_of_scores['NEGATIVE'] = summary_of_scores['NEGATIVE']/ summary_of_scores['NUM_NEGATIVE']

# print(sentiment_score)
# print(summary_of_scores)
# final_score = (summary_of_scores['POSITIVE'] - summary_of_scores['NEGATIVE']) / (summary_of_scores["NUM_POSITIVE"] + summary_of_scores["NUM_NEGATIVE"])
# print(final_score)

# # for row in rows:
# #     print(row)

# # change it to a long string

# # perform sentiment analysis