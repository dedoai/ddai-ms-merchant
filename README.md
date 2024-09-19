k# ddai-ms-merchant

![Node.js](https://img.shields.io/badge/Node.js-14.x-green)
![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-yellow)
![License](https://img.shields.io/badge/License-MIT-green)

**dedoAI** - Merchant Microservice for DEDO Token Transactions

---

## Overview

The `ddai-ms-merchant` service is a microservice responsible for managing economic transactions involving the **DEDO token**, supporting sales of datasets on the dedoAI platform and integrating with the proprietary Blockchain. It provides RESTful APIs to facilitate the creation, retrieval, update, and deletion of transactions.

---

## Features

- **Transaction Management**: Full CRUD operations for handling DEDO token transactions related to dataset sales.
- **File Management**: Supports uploading, retrieving, and deleting files associated with transactions.
- **Blockchain Integration**: Connects to the proprietary dedoAI Blockchain for secure and transparent transactions.
- **Dockerized**: Packaged as a Docker container for scalable deployment.
- **AWS Lambda**: Uses serverless architecture for handling transaction operations.

---

## Technologies

- **Node.js**: The core backend logic is implemented in Node.js.
- **AWS Lambda**: Serverless platform used to manage transaction requests.
- **Docker**: Containerized for scalable and seamless deployment.
- **Proprietary Blockchain**: Integrates with the dedoAI Blockchain for managing DEDO token transactions.

---

## API Endpoints

The following APIs are exposed by the service:

| Method | Endpoint                 | Description                                       |
|--------|--------------------------|---------------------------------------------------|
| GET    | `/merchant`               | Retrieve transaction details or associated files  |
| POST   | `/merchant`               | Create a new transaction                          |
| PUT    | `/merchant/{id}`          | Update an existing transaction                    |
| DELETE | `/merchant/{id}`          | Delete a transaction                              |

### Example Request

```bash
curl -X POST "https://your-api-endpoint/merchant" \
-H "Content-Type: application/json" \
-d '{"title": "Dataset Transaction", "amount": 100, "token": "DEDO"}'
```

---

## Getting Started

### Prerequisites

To run or contribute to this project, you will need:

- **Node.js** (version 14.x or higher)
- **AWS CLI**: To interact with AWS services.
- **Docker**: Required for running and packaging the Lambda function.

### Setup Instructions

1. Clone the repository:

    ```bash
    git clone https://github.com/dedoAI/ddai-ms-merchant.git
    cd ddai-ms-merchant
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Build and run the Docker container:

    ```bash
    docker build -t ddai-ms-merchant .
    docker run -p 8080:8080 ddai-ms-merchant
    ```

4. The API will be available at `http://localhost:8080`.

---

## Deployment

This Lambda function can be deployed using Docker and AWS services. To deploy:

1. Build the Docker image:

    ```bash
    docker build -t ddai-ms-merchant .
    ```

2. Push the Docker image to an AWS ECR repository:

    ```bash
    docker tag ddai-ms-merchant:latest 123456789012.dkr.ecr.region.amazonaws.com/ddai-ms-merchant:latest
    docker push 123456789012.dkr.ecr.region.amazonaws.com/ddai-ms-merchant:latest
    ```

3. Deploy the Lambda function using AWS CLI or CloudFormation.

---

## Testing

To run unit tests for this service, use the following command:

```bash
npm test
```

You can also test the Lambda function locally using Docker:

```bash
docker run -p 8080:8080 ddai-ms-merchant
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contact

For more information about dedoAI or to get in touch with the team:

- **Website**: [dedo.org](https://www.dedo.org)
- **Email**: support@dedo.org

