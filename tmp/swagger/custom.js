const options = {
    // customCss: '.swagger-ui .topbar { display: none }'
    customSiteTitle: "AmorMiau Swagger",
    customCss: ` .swagger-ui .topbar {
      background: #00b4db;
      background: -webkit-linear-gradient(to right, #0083b0, #00b4db);
      background: linear-gradient(to right, #0083b0, #00b4db);
      border-bottom: 1px solid #10707f;
      height: 120px;
    }
    .swagger-ui img {
      content: url(https://img.icons8.com/external-justicon-flat-justicon/200/external-cat-dog-and-cat-justicon-flat-justicon-4.png);
      height: 140px;
      width: auto;
    }
    .swagger-ui .markdown p a:hover {      
      color: #00b4db !important;
      transition: all 0.4s ease-in-out 0s !important;
    }
    `,
    customfavIcon: `https://img.icons8.com/external-justicon-flat-justicon/32/external-cat-dog-and-cat-justicon-flat-justicon-4.png`
};

module.exports = options;