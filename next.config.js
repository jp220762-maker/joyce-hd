/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@resvg/resvg-js'],
    // ecpay_aio_nodejs 在執行時用相對路徑讀取 ECpayPayment.xml，
    // Next.js 的檔案追蹤機制偵測不到這類動態路徑，需手動指定納入打包範圍。
    outputFileTracingIncludes: {
      '/api/report/create-order': ['./node_modules/ecpay_aio_nodejs/lib/ecpay_payment/ECpayPayment.xml'],
      '/api/report/ecpay-notify': ['./node_modules/ecpay_aio_nodejs/lib/ecpay_payment/ECpayPayment.xml'],
    },
  },
};
