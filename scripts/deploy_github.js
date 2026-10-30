const https = require('https');
const { execSync } = require('child_process');

const TOKEN = process.argv[2] || process.env.GH_TOKEN;
if (!TOKEN) {
  console.error("Token não informado.");
  process.exit(1);
}

const REPO_NAME = "nbs-assistente";

function requestGitHub(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'User-Agent': 'NBS-Assistente-Deployer',
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(" Verificando credenciais no GitHub...");
  const userRes = await requestGitHub('GET', '/user');
  if (userRes.status !== 200) {
    console.error("Falha de autenticação:", userRes.status, userRes.data);
    process.exit(1);
  }

  const username = userRes.data.login;
  console.log(` Usuário autenticado: ${username} (${userRes.data.name || username})`);

  console.log(` Criando/verificando repositório '${REPO_NAME}'...`);
  const createRes = await requestGitHub('POST', '/user/repos', {
    name: REPO_NAME,
    description: "Cérebro Tributário e Agente de IA para NBS, LC 116 e IBS/CBS (Reforma Tributária LC 214/2025)",
    private: false
  });

  let repoUrl = '';
  if (createRes.status === 201) {
    console.log(` Repositório '${REPO_NAME}' criado com sucesso no GitHub!`);
    repoUrl = createRes.data.clone_url;
  } else if (createRes.status === 422) {
    console.log(` Repositório '${REPO_NAME}' já existe no GitHub.`);
    repoUrl = `https://github.com/${username}/${REPO_NAME}.git`;
  } else {
    console.error("Erro ao criar repositório:", createRes.status, createRes.data);
    process.exit(1);
  }

  console.log(` URL do repositório: https://github.com/${username}/${REPO_NAME}`);

  // Configurar remote git com autenticação
  const authRemoteUrl = `https://${username}:${TOKEN}@github.com/${username}/${REPO_NAME}.git`;
  
  try {
    try {
      execSync('git remote remove origin', { stdio: 'ignore' });
    } catch (e) {}

    execSync(`git remote add origin ${authRemoteUrl}`, { stdio: 'inherit' });
    console.log(" Realizando git push para o GitHub...");
    execSync('git push -u origin main --force', { stdio: 'inherit' });
    console.log("\n🚀 CÓDIGO ENVIADO COM SUCESSO PARA O GITHUB!");
    console.log(`👉 Repositório Público: https://github.com/${username}/${REPO_NAME}`);
  } catch (err) {
    console.error("Erro durante git push:", err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Erro geral:", err);
  process.exit(1);
});
