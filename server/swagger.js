const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Anlıkeleman.com API Dokümantasyonu',
      version: '1.0.0',
      description: 'Anlıkeleman.com iş platformu API dokümantasyonu',
      contact: {
        name: 'API Destek',
        email: 'destek@anlik-eleman.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Geliştirme Sunucusu'
      },
      {
        url: 'https://api.anlik-eleman.com',
        description: 'Üretim Sunucusu'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js', './models/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs; 