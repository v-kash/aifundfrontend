// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   output: 'standalone',
//   async rewrites() {
//     // Use 'backend' for Docker production, 'localhost' for local dev
//     const apiUrl = process.env.NODE_ENV === 'production' 
//       ? 'http://backend:8000/api/:path*' 
//       : 'http://localhost:8000/api/:path*';
      
//     return [
//       {
//         source: '/api/:path*',
//         destination: apiUrl,
//       },
//     ];
//   },
// };

// export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

export default nextConfig;