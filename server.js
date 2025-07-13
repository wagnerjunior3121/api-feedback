require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// 🌐 Conexão com MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB Atlas!'))
  .catch(err => console.error('❌ Erro ao conectar no MongoDB Atlas:', err));

// 📦 Modelo Feedback com imagem
const Feedback = mongoose.model('Feedback', {
  cliente: String,
  ordemServico: String,
  tipoServico: String,
  descricao: String,
  nota: Number,
  observacoes: String,
  parametros: [String],
  imagemBase64: String, // ✅ Campo para armazenar imagem base64
  data: { type: Date, default: Date.now }
});

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // ✅ Aumenta o limite para aceitar imagens grandes

// 📌 Rota para salvar nova avaliação
app.post('/api/avaliacoes', async (req, res) => {
  try {
    const nova = new Feedback(req.body);
    await nova.save();
    res.status(201).json({ mensagem: 'Avaliação salva com sucesso!' });
  } catch (err) {
    console.error('Erro ao salvar:', err);
    res.status(500).json({ erro: 'Erro ao salvar avaliação.' });
  }
});

// 📌 Rota para listar avaliações com filtros opcionais
app.get('/api/avaliacoes', async (req, res) => {
  try {
    const { ordemServico, tipoServico, notaMin, busca } = req.query;
    const filtro = {};

    if (ordemServico) {
      filtro.ordemServico = { $regex: ordemServico, $options: 'i' };
    }

    if (tipoServico) {
      filtro.tipoServico = tipoServico;
    }

    if (notaMin) {
      filtro.nota = { $gte: Number(notaMin) };
    }

    if (busca) {
      filtro.$or = [
        { descricao: { $regex: busca, $options: 'i' } },
        { observacoes: { $regex: busca, $options: 'i' } }
      ];
    }

    const avaliacoes = await Feedback.find(filtro).sort({ data: -1 });
    res.json(avaliacoes);
  } catch (err) {
    console.error('Erro ao buscar avaliações:', err); // já existe isso no seu código
    res.status(500).json({ erro: 'Erro ao buscar avaliações.', detalhes: err.message }); // adicione isso para ver detalhes no navegador
  }  
});

// 📌 Rota para deletar avaliação por ID
app.delete('/api/avaliacoes/:id', async (req, res) => {
  const { id } = req.params;
  console.log('ID recebido para exclusão:', id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log('ID inválido');
    return res.status(400).json({ erro: 'ID inválido' });
  }

  try {
    const deletado = await Feedback.findByIdAndDelete(id);
    if (!deletado) {
      console.log('Avaliação não encontrada para ID:', id);
      return res.status(404).json({ erro: 'Avaliação não encontrada' });
    }
    console.log('Avaliação excluída:', deletado);
    res.json({ mensagem: 'Avaliação excluída com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir:', err);
    res.status(500).json({ erro: 'Erro ao excluir avaliação' });
  }
});

// 🚀 Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});