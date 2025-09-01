FROM golang:1.22-alpine as build
WORKDIR /app
COPY . .
RUN go build -o server ./cmd/server

FROM alpine:3.19
WORKDIR /app
COPY --from=build /app/server .
EXPOSE 3001
CMD ["./server"]
