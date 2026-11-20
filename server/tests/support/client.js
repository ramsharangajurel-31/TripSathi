import http from "node:http";

export function listen(app) {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

/**
 * A small test browser: it remembers cookies between requests and sends an
 * Origin header like a real page does. (It does not apply cookie Path rules.)
 */
export class TestClient {
  constructor(baseUrl, origin) {
    this.baseUrl = baseUrl;
    this.origin = origin;
    this.cookies = new Map();
    this.lastSetCookies = [];
  }

  request(method, path, { body, headers = {} } = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const payload =
        body === undefined ? null : typeof body === "string" ? body : JSON.stringify(body);

      const requestHeaders = { Origin: this.origin, ...headers };
      if (payload !== null) {
        requestHeaders["Content-Type"] = "application/json";
        requestHeaders["Content-Length"] = Buffer.byteLength(payload);
      }
      if (this.cookies.size > 0) {
        requestHeaders.Cookie = [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; ");
      }

      const req = http.request(
        {
          host: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          method,
          headers: requestHeaders,
          agent: false,
        },
        (res) => {
          let raw = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => (raw += chunk));
          res.on("end", () => {
            this.#remember(res.headers["set-cookie"] ?? []);

            let json = null;
            try {
              json = raw ? JSON.parse(raw) : null;
            } catch {
              // not JSON
            }
            resolve({ status: res.statusCode, headers: res.headers, json, setCookies: this.lastSetCookies });
          });
        }
      );

      req.on("error", reject);
      if (payload !== null) req.write(payload);
      req.end();
    });
  }

  #remember(lines) {
    this.lastSetCookies = lines;

    for (const line of lines) {
      const [pair, ...attributes] = line.split(";");
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();

      const expires = attributes.find((attribute) => /^\s*expires=/i.test(attribute));
      const isExpired = expires && new Date(expires.split("=")[1]).getTime() <= Date.now();

      if (value === "" || isExpired) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  get(path, options) {
    return this.request("GET", path, options);
  }
  post(path, body, options = {}) {
    return this.request("POST", path, { ...options, body });
  }
  patch(path, body, options = {}) {
    return this.request("PATCH", path, { ...options, body });
  }
}