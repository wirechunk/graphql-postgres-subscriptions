FROM mhart/alpine-node:12.21.0
WORKDIR /test
ADD . /test/
RUN yarn