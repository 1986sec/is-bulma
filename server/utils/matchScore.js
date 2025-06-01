const natural = require('natural');

exports.calculateMatchScore = (cvText, jobText) => {
  const tfidf = new natural.TfIdf();
  tfidf.addDocument(cvText);
  tfidf.addDocument(jobText);
  const vecA = tfidf.listTerms(0).map(t => t.tfidf);
  const vecB = tfidf.listTerms(1).map(t => t.tfidf);
  const dot = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (normA * normB || 1);
}; 