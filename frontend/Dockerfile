FROM node:18-alpine

WORKDIR /workspace

# Copy dependencies manifest and lockfiles
COPY package.json .

# Install node dependencies
RUN npm install

# Copy application source
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
