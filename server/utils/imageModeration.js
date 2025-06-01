const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

exports.moderateImage = async (buffer) => {
  const [result] = await client.safeSearchDetection({ image: { content: buffer } });
  const detections = result.safeSearchAnnotation;
  if (detections.adult === 'LIKELY' || detections.violence === 'LIKELY') {
    return { flagged: true, reason: 'Uygunsuz içerik' };
  }
  return { flagged: false };
}; 