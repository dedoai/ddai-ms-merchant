# Define custom function directory
ARG APP_DIR="/app"

FROM public.ecr.aws/eks-distro-build-tooling/nodejs:16.18.1-gcc-al23 as build-image

# Include global arg in this stage of the build
ARG APP_DIR

# Copy function code
RUN mkdir -p ${APP_DIR}
COPY app/* ${APP_DIR}/

WORKDIR ${APP_DIR}

# Install Node.js dependencies
RUN npm install

# Grab a fresh slim copy of the image to reduce the final size
FROM public.ecr.aws/eks-distro-build-tooling/eks-distro-minimal-base-nodejs:16.18.1-al23

# Include global arg in this stage of the build
ARG APP_DIR

# Set working directory to function root directory
WORKDIR ${APP_DIR}

# Copy in the built dependencies
COPY --from=build-image ${APP_DIR} ${APP_DIR}

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
