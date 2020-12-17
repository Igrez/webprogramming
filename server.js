const path = require('path');
const url = require('url');
const http = require('http');
const https = require('https');
const redirectUri = 'http://127.0.0.1:3000/';
const displayType = 'page';
const fs = require('fs');
const hostname = '127.0.0.1';
const port = 3000;
const clientId = 7663475;
const clientSecret = '4NznFDID7MkPNdEq8VB5';

const server = http.createServer((req, res) => {
    const { pathname } = url.parse(req.url);

    switch (pathname) {
        case '/data':
            return loginRoute(req, res);
        default:
            return mainRoute(req, res);
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

const mainRoute = (req, res) => {
    const { query: { code } } = url.parse(req.url, true);
    if (code) {
        renderProfilePage(res, code);
    } else {
        renderMainPage(res);
    }
};
const loginRoute = (req, res) => {
    const pathName = 'https://oauth.vk.com/authorize';
    res.writeHead(302, {
        'Location': url.format({
            pathname: pathName,
            query: {
                client_id: clientId,
                redirect_uri: redirectUri,
                display: displayType
            }
        })
    });
    res.end();
};

const renderProfilePage = (res, code) => {
    const host = 'https://oauth.vk.com/access_token';
    https.get(url.format({
        pathname: host,
        query: {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
        }
    }), (resp) => {
        let body = '';

        resp.setEncoding('utf8');
        resp.on('data', data => {
            body += data;
        });
        resp.on('end', () => {
            const { access_token, user_id } = JSON.parse(body);
            const pathName = 'https://api.vk.com/method/users.get';
            const version = '5.124';

            https.get(url.format({
                pathname: pathName,
                query: {
                    user_ids: user_id,
                    access_token,
                    v: version
                }
            }), (resp) => {
                let body = '';

                resp.setEncoding('utf8');
                resp.on('data', data => {
                    body += data;
                });
                resp.on('end', () => {
                    const data = JSON.parse(body);

                    if (data.error) {
                        console.error(data.error);
                        renderMainPage(res);
                    } else {
                        const { response: [{ first_name, last_name }] } = data;

                        res.setHeader("Content-Type", "text/html; charset=utf-8;");
                        res.write(`${first_name} ${last_name}`);
                        res.end();
                    }
                });
            }).on('error', (e) => {
                console.error(e);
                renderMainPage(res);
            });
        });
    }).on('error', (e) => {
        console.error(e);
        renderMainPage(res);
    });
};

const renderMainPage = (res) => {
    const filePath = path.join(__dirname, 'index.html');

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500);
            res.end('Internal Server Error');
        } else {
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.end(data);
        }
    })
};
