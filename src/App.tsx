import React, { useState } from 'react';
import { Printer, Plus, Image as ImageIcon, Search, Expand, X, Loader2, Upload, ExternalLink } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Item {
  id: string;
  name: string;
  description: string;
  link?: string;
  imageUrl: string;
}

const INITIAL_ITEMS: Item[] = [
  {
    id: '1',
    name: 'Caneta permanente preta',
    description: 'Essencial para preencher a claquete a cada take. Também serve para marcação de chão para atores e identificação rápida de equipamentos e fitas.',
    link: 'https://www.mercadolivre.com.br/p/MLB25845222',
    imageUrl: 'https://placehold.co/150x150/e2e8f0/475569?text=Caneta+Preta'
  },
  {
    id: '2',
    name: 'Gaffer colorida',
    description: 'Fundamental para a marcação segura de atores e organização visual do cabeamento. A fita não deixa resíduos de cola, protegendo o piso e paredes da locação e os equipamentos.',
    link: 'https://www.mercadolivre.com.br/up/MLBU1737842312',
    imageUrl: 'https://placehold.co/150x150/e2e8f0/475569?text=Gaffer+Colorida'
  },
  {
    id: '3',
    name: 'Jogo de chaves Allen',
    description: 'Indispensável para montagem e ajustes rápidos de acessórios de câmera, monitores e tripés.',
    link: 'https://www.mercadolivre.com.br/up/MLBU3759807928',
    imageUrl: 'https://placehold.co/150x150/e2e8f0/475569?text=Chaves+Allen'
  },
  {
    id: '4',
    name: '10 sacos de areia 5kg',
    description: 'Questão de segurança primária no set. Estabiliza tripés de luz, tripés de câmera e práticados, prevenindo acidentes graves com a equipe e danos a equipamentos caros.',
    link: 'https://www.mercadolivre.com.br/p/MLB2022903712',
    imageUrl: 'https://placehold.co/150x150/e2e8f0/475569?text=Sacos+de+Areia'
  },
  {
    id: '5',
    name: 'Cabos USB 60w (3 tipo c - usb normal, 5 tipo c - tipo c)',
    description: 'Necessários para manter baterias de câmera e luzes, tablets e celulares. A potência de 60W garante recarga ultrarrápida.',
    link: 'https://www.mercadolivre.com.br/up/MLBU1967331130',
    imageUrl: 'https://placehold.co/150x150/e2e8f0/475569?text=Cabos+USB+60w'
  },
  {
    id: '6',
    name: 'Remédios: Buscopan, Atroveran e dipirona',
    description: 'Kit de primeiros socorros essencial para tratar desconfortos leves e dores na equipe. Permite alívio rápido, evitando atrasar o cronograma.',
    imageUrl: 'https://placehold.co/150x150/e2e8f0/475569?text=Remedios'
  },
  {
    id: '7',
    name: 'Impressora (p&b e colorida, folhas a4)',
    description: 'Vital para imprimir Ordens do Dia (OD), roteiros com emendas de última hora, decupagens e autorizações de imagem.',
    imageUrl: 'https://placehold.co/150x150/e2e8f0/475569?text=Impressora'
  },
  {
    id: '8',
    name: 'Conversor SDI-HDMI (Blackmagic PYXIS)',
    description: 'Necessário para converter o sinal de vídeo da Blackmagic PYXIS e enviá-lo a um monitor de referência HDMI, garantindo avaliação de enquadramento em tempo real.',
    imageUrl: 'https://placehold.co/150x150/e2e8f0/475569?text=Conversor+SDI'
  }
];

export default function App() {
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  
  const [newName, setNewName] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newDescription, setNewDescription] = useState('');
  
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, itemId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (itemId) {
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, imageUrl: base64 } : i));
      } else {
        setNewImageUrl(base64);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  const generateImageWithAI = async (name: string, description: string): Promise<string | null> => {
    try {
      // @ts-ignore
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
      
      // @ts-ignore
      const userApiKey = process.env.API_KEY;
      if (!userApiKey) {
          throw new Error("API Key not found after selection.");
      }
      
      const ai = new GoogleGenAI({ apiKey: userApiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: `A clear, professional product photography of: ${name}. ${description}. White background, studio lighting, high quality.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "512px"
          }
        }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Erro ao gerar imagem com IA.");
    }
    return null;
  };

  const handleGenerateItemImage = async (item: Item) => {
    setLoadingImages(prev => ({ ...prev, [item.id]: true }));
    const newUrl = await generateImageWithAI(item.name, item.description);
    if (newUrl) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, imageUrl: newUrl } : i));
    }
    setLoadingImages(prev => ({ ...prev, [item.id]: false }));
  };

  const handleGenerateNewImage = async () => {
    if (!newName) {
      alert("Preencha o nome do produto primeiro para gerar a imagem.");
      return;
    }
    setIsGeneratingNew(true);
    const newUrl = await generateImageWithAI(newName, newDescription);
    if (newUrl) {
      setNewImageUrl(newUrl);
    }
    setIsGeneratingNew(false);
  };

  const handleAddItem = () => {
    if (!newName || !newDescription) {
      alert("Por favor, preencha o nome e a justificativa.");
      return;
    }

    const finalImageUrl = newImageUrl || `https://placehold.co/150x150/e2e8f0/475569?text=${encodeURIComponent(newName.split(' ').slice(0, 2).join('+'))}`;

    const newItem: Item = {
      id: Date.now().toString(),
      name: newName,
      description: newDescription,
      link: newLink,
      imageUrl: finalImageUrl
    };

    setItems([...items, newItem]);
    setNewName('');
    setNewLink('');
    setNewDescription('');
    setNewImageUrl(null);
  };

  const getGoogleImagesUrl = (query: string) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-800 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-lg rounded-lg print:shadow-none print:p-0 print:max-w-full print:m-0">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b-2 border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wide text-gray-900">Pedido de Produção</h1>
          </div>
          <button 
            onClick={() => window.print()} 
            className="print:hidden bg-gray-800 text-white px-6 py-2 rounded shadow hover:bg-gray-700 transition flex items-center gap-2"
          >
            <Printer size={18} />
            Imprimir / PDF
          </button>
        </div>

        {/* List */}
        <div className="space-y-6">
          {items.map(item => (
            <div key={item.id} className="border-b border-gray-200 pb-6 mb-6 last:border-0 print:break-inside-avoid">
              <h2 className="text-xl font-semibold mb-3 text-gray-900">{item.name}</h2>
              
              <div className="flex flex-row gap-4 items-start">
                {/* Image */}
                <div 
                  className="relative group cursor-pointer shrink-0"
                  onClick={() => setExpandedImage(item.imageUrl)}
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-16 h-16 md:w-20 md:h-20 object-cover rounded border border-gray-200 shadow-sm group-hover:opacity-90 transition"
                    referrerPolicy="no-referrer"
                  />
                  {loadingImages[item.id] && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded">
                      <Loader2 className="animate-spin text-blue-600" size={20} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition rounded flex items-center justify-center">
                    <Expand className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" size={16} />
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 mb-2 leading-relaxed text-sm md:text-base">{item.description}</p>
                  {item.link && (
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm break-all block mb-2"
                    >
                      {item.link}
                    </a>
                  )}
                  
                  {/* Manual fetch buttons */}
                  <div className="mt-3 flex flex-wrap gap-2 print:hidden">
                    <label className="cursor-pointer text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1.5 rounded hover:bg-blue-100 flex items-center gap-1 transition">
                      <Upload size={14}/> Upload Foto
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, item.id)} />
                    </label>
                    <a 
                      href={getGoogleImagesUrl(item.name)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-1.5 rounded hover:bg-green-100 flex items-center gap-1 transition"
                    >
                      <ExternalLink size={14}/> Google Imagens
                    </a>
                    <button 
                      onClick={() => handleGenerateItemImage(item)}
                      disabled={loadingImages[item.id]}
                      className="text-xs bg-purple-50 text-purple-600 border border-purple-200 px-2 py-1.5 rounded hover:bg-purple-100 flex items-center gap-1 transition disabled:opacity-50"
                    >
                      {loadingImages[item.id] ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14}/>} 
                      Gerar IA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Form */}
        <div className="print:hidden mt-12 bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
            <Plus size={20} />
            Adicionar Novo Item
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nome do Produto" 
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            />
            <input 
              type="text" 
              value={newLink}
              onChange={e => setNewLink(e.target.value)}
              placeholder="Link (Opcional)" 
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            />
            <textarea 
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Justificativa / Descrição" 
              className="p-3 border border-gray-300 rounded-lg w-full md:col-span-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white" 
              rows={3}
            />
            
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 items-start bg-white p-4 rounded-lg border border-gray-200">
              <div className="shrink-0">
                {newImageUrl ? (
                  <div className="relative group">
                    <img src={newImageUrl} alt="Preview" className="w-24 h-24 object-cover rounded border border-gray-200" />
                    <button onClick={() => setNewImageUrl(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"><X size={14}/></button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded border border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-1">
                    <ImageIcon size={24} />
                    <span className="text-[10px] uppercase tracking-wider">Sem Imagem</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-medium text-gray-700">Imagem do Produto (Opcional)</p>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer text-sm bg-blue-50 text-blue-600 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center gap-2 transition">
                    <Upload size={16}/> Fazer Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e)} />
                  </label>
                  
                  <button 
                    onClick={handleGenerateNewImage}
                    disabled={isGeneratingNew || !newName}
                    className="text-sm bg-purple-50 text-purple-600 border border-purple-200 px-3 py-2 rounded-lg hover:bg-purple-100 flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {isGeneratingNew ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16}/>}
                    Gerar com IA
                  </button>

                  {newName && (
                    <a 
                      href={getGoogleImagesUrl(newName)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm bg-green-50 text-green-600 border border-green-200 px-3 py-2 rounded-lg hover:bg-green-100 flex items-center gap-2 transition"
                    >
                      <ExternalLink size={16}/> Buscar no Google
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 mt-2">
              <button 
                onClick={handleAddItem}
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 font-medium text-lg shadow-sm"
              >
                <Plus size={20} />
                Adicionar à Lista
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Lightbox Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 print:hidden backdrop-blur-sm"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <button 
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition bg-black/50 rounded-full p-2"
              onClick={() => setExpandedImage(null)}
            >
              <X size={24} />
            </button>
            <img 
              src={expandedImage} 
              alt="Expanded view" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
