FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /steve-server .

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
COPY --from=builder /steve-server /usr/local/bin/steve-server
COPY dist /usr/share/rancher/ui
ENTRYPOINT ["steve-server", "--sql-cache", "--debug", "-ui-path", "/usr/share/rancher/ui"]
