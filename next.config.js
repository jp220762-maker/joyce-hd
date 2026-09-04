/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    // ecpay_aio_nodejs 內部用 __dirname 相對路徑讀取 ECpayPayment.xml；
    // 若被 webpack 打包進單一 chunk，__dirname 會變成 chunk 檔案的位置而非
    // 套件原本在 node_modules 裡的路徑，導致讀檔失敗。
    // 加入 externalPackages 讓這個套件維持原始檔案結構、以一般 require() 執行。
    serverComponentsExternalPackages: ['@resvg/resvg-js', 'ecpay_aio_nodejs'],
    outputFileTracingIncludes: {
      '/api/report/create-order': ['./node_modules/ecpay_aio_nodejs/lib/ecpay_payment/ECpayPayment.xml'],
      '/api/report/ecpay-notify': ['./node_modules/ecpay_aio_nodejs/lib/ecpay_payment/ECpayPayment.xml'],
    },
  },
};
