<h1 align="center">
  HR Management Employee API
</h1>

### Kelompok PAW 11
| Name                            | NIM                |
| ------------------------------- | ------------------ |
| Iqbal Hidayat Rasyad            | 22/506066/TK/55425 |
| Adzka Bagus Juniarta            | 22/500276/TK/54824 |
| Bulan Aprilia Putri Murela      | 22/500326/TK/54834 |
| Christella Jesslyn Dewantara    | 22/493149/TK/54003 |
| Muhammad Zidane Septian Irsyadi | 22/504678/TK/55212 |


# Setting Up Project

## Clone into your local directory with

```
git clone https://github.com/PAW11-oke/be-management-employee.git
```

## Install the dependency

```
npm install
```
or
```bash
yarn install
```

## Setup dummy backend for upload
Make the `.env` file and fill in the actual values for the environment variables.

```bash
MONGODB_URI= <Connection string for MongoDB database>
PORT= <Port on which the application will run>

JWT_SECRET= <Secret key for JWT authentication>
JWT_EXPIRES_IN= <Expiration time for JWT tokens>  
JWT_COOKIE_EXPIRES_IN= <Expiration time for JWT cookies>      
NODE_ENV= <Set the environment>      

EMAIL_USER= <User for the email service (Mailtrap in this case)>
EMAIL_PASS= <Password for the email service> 
EMAIL_SERVICE= <Email service provider (SMTP in this case)>
EMAIL_PORT= <Port for the email service>
EMAIL_USERNAME= <Email username for email verify>
EMAIL_PASSWORD= <Email password for email verify> 

GOOGLE_CLIENT_ID= <Client ID for Google OAuth>
GOOGLE_CLIENT_SECRET= <Client secret for Google OAuth> 
```

## Run the development server

```bash
npm run dev
```
or
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack
1. Google OAuth with Passport.js: Implements Google OAuth 2.0 for secure user authentication using Passport.js middleware.
2. SMTP Mailtrap with Nodemailer: Sends emails for account verification and password resets via Mailtrap and Nodemailer.
3. Login Attempt Logic: Limits login attempts and temporarily locks accounts after repeated failed attempts to prevent brute-force attacks.
4. JWT Authentication and Route Protection: Uses JWT to secure routes, managing user sessions with token-based authentication.
5. Cookies: Stores JWT in secure HTTP cookies to manage user sessions.
6. MongoDB Database: Utilizes MongoDB with Mongoose for storing and managing application data in a NoSQL database.
