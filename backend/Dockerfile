# Stage 1: Build the Go binary
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install ca-certificates and tzdata for Indian Standard Time (IST)
RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod go.sum* ./
RUN go mod download

COPY . .

# Build statically linked binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o railtracker .

# Stage 2: Minimal Production Image
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Kolkata

COPY --from=builder /app/railtracker /app/railtracker

EXPOSE 8080

CMD ["/app/railtracker"]
