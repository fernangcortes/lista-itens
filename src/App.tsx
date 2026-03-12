import React, { useState, useEffect, useRef } from 'react';
import { Printer, Plus, Image as ImageIcon, Search, Expand, X, Loader2, Upload, ExternalLink, Edit2, Trash2, Save, Palette, Wand2, List as ListIcon, ChevronDown } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Theme {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  titleFont: string;
  titleSize: string;
  itemTitleFont: string;
  itemTitleSize: string;
  descFont: string;
  descSize: string;
}

interface Item {
  id: string;
  name: string;
  description: string;
  link?: string;
  imageUrl: string;
}

interface List {
  id: string;
  title: string;
  items: Item[];
  theme: Theme;
  updatedAt: number;
}

const FONTS = ['Inter', 'Merriweather', 'JetBrains Mono', 'Playfair Display', 'Outfit'];
const SIZES = ['12px', '14px', '16px', '18px', '20px', '22px', '24px', '28px', '32px', '36px', '40px', '48px'];

const THEME_PRESETS: Theme[] = [
  { id: 'classic', name: 'Clássico Claro', bgColor: '#ffffff', textColor: '#1f2937', accentColor: '#3b82f6', titleFont: 'Inter', titleSize: '36px', itemTitleFont: 'Inter', itemTitleSize: '20px', descFont: 'Inter', descSize: '16px' },
  { id: 'dark', name: 'Escuro Elegante', bgColor: '#111827', textColor: '#f3f4f6', accentColor: '#8b5cf6', titleFont: 'Playfair Display', titleSize: '40px', itemTitleFont: 'Outfit', itemTitleSize: '22px', descFont: 'Inter', descSize: '15px' },
  { id: 'warm', name: 'Orgânico Quente', bgColor: '#fdfbf7', textColor: '#4338ca', accentColor: '#d97706', titleFont: 'Merriweather', titleSize: '34px', itemTitleFont: 'Merriweather', itemTitleSize: '20px', descFont: 'Inter', descSize: '16px' },
  { id: 'mono', name: 'Minimalista', bgColor: '#fafafa', textColor: '#000000', accentColor: '#000000', titleFont: 'JetBrains Mono', titleSize: '32px', itemTitleFont: 'JetBrains Mono', itemTitleSize: '18px', descFont: 'JetBrains Mono', descSize: '14px' },
  { id: 'pastel', name: 'Pastel Suave', bgColor: '#f0fdf4', textColor: '#064e3b', accentColor: '#10b981', titleFont: 'Outfit', titleSize: '38px', itemTitleFont: 'Outfit', itemTitleSize: '22px', descFont: 'Inter', descSize: '16px' },
];

const INITIAL_ITEMS: Item[] = [
  { id: '1', name: 'Caneta permanente preta', description: 'Essencial para preencher a claquete a cada take. Também serve para marcação de chão para atores e identificação rápida de equipamentos e fitas.', link: 'https://www.mercadolivre.com.br/p/MLB25845222', imageUrl: 'https://placehold.co/150x150/e2e8f0/475569?text=Caneta+Preta' },
  { id: '2', name: 'Gaffer colorida', description: 'Fundamental para a marcação segura de atores e organização visual do cabeamento. A fita não deixa resíduos de cola, protegendo o piso e paredes da locação e os equipamentos.', link: 'https://www.mercadolivre.com.br/up/MLBU1737842312', imageUrl: 'https://placehold.co/150x150/e2e8f0/475569?text=Gaffer+Colorida' },
  { id: '3', name: 'Jogo de chaves Allen', description: 'Indispensável para montagem e ajustes rápidos de acessórios de câmera, monitores e tripés.', link: 'https://www.mercadolivre.com.br/up/MLBU3759807928', imageUrl: 'https://placehold.co/150x150/e2e8f0/475569?text=Chaves+Allen' },
  { id: '4', name: '10 sacos de areia 5kg', description: 'Questão de segurança primária no set. Estabiliza tripés de luz, tripés de câmera e práticados, prevenindo acidentes graves com a equipe e danos a equipamentos caros.', link: 'https://www.mercadolivre.com.br/p/MLB2022903712', imageUrl: 'https://placehold.co/150x150/e2e8f0/475569?text=Sacos+de+Areia' },
];

export default function App() {
  // State
  const [lists, setLists] = useState<List[]>(() => {
    const saved = localStorage.getItem('production_lists');
    if (saved) return JSON.parse(saved);
    return [{ id: 'default', title: 'Pedido de Produção', items: INITIAL_ITEMS, theme: THEME_PRESETS[0], updatedAt: Date.now() }];
  });
  const [currentListId, setCurrentListId] = useState<string>(lists[0]?.id || 'default');
  
  const currentList = lists.find(l => l.id === currentListId) || lists[0];

  // UI States
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [isListSelectorOpen, setIsListSelectorOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  
  // Edit States
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemData, setEditItemData] = useState<Partial<Item>>({});

  // Add Item States
  const [newName, setNewName] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  
  // AI States
  const [aiCharLimit, setAiCharLimit] = useState(300);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('production_lists', JSON.stringify(lists));
  }, [lists]);

  // History for Autocomplete
  const allHistoricalNames = Array.from(new Set(lists.flatMap(l => l.items.map(i => i.name)))).filter(Boolean);

  // Helpers
  const updateCurrentList = (updates: Partial<List>) => {
    setLists(prev => prev.map(l => l.id === currentListId ? { ...l, ...updates, updatedAt: Date.now() } : l));
  };

  const createNewList = () => {
    const newList: List = {
      id: Date.now().toString(),
      title: 'Nova Lista de Pedidos',
      items: [],
      theme: THEME_PRESETS[0],
      updatedAt: Date.now()
    };
    setLists([...lists, newList]);
    setCurrentListId(newList.id);
    setIsListSelectorOpen(false);
  };

  const deleteList = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (lists.length === 1) return alert("Você não pode deletar a última lista.");
    if (confirm("Tem certeza que deseja deletar esta lista?")) {
      const newLists = lists.filter(l => l.id !== id);
      setLists(newLists);
      if (currentListId === id) setCurrentListId(newLists[0].id);
    }
  };

  // AI Functions
  const generateDescription = async (name: string, limit: number, setter: (desc: string) => void) => {
    if (!name) return alert("Preencha o nome do produto primeiro.");
    setIsGeneratingDesc(true);
    try {
      // @ts-ignore
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
      // @ts-ignore
      const userApiKey = process.env.API_KEY;
      if (!userApiKey) throw new Error("API Key not found.");
      
      const ai = new GoogleGenAI({ apiKey: userApiKey });
      const prompt = `Escreva uma descrição técnica e justificativa de compra para o item de produção audiovisual: "${name}". A descrição DEVE ter no máximo ${limit} caracteres. Seja direto, profissional e explique por que é essencial no set de filmagem. Retorne APENAS o texto da descrição, sem aspas ou introduções.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt
      });
      
      setter(response.text?.trim() || '');
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar descrição com IA.");
    } finally {
      setIsGeneratingDesc(false);
    }
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
      if (!userApiKey) throw new Error("API Key not found.");
      
      const ai = new GoogleGenAI({ apiKey: userApiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: `A clear, professional product photography of: ${name}. ${description}. White background, studio lighting, high quality.` }]
        },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "512px" } }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar imagem com IA.");
    }
    return null;
  };

  // Item Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setter(event.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddItem = () => {
    if (!newName || !newDescription) return alert("Por favor, preencha o nome e a justificativa.");
    const finalImageUrl = newImageUrl || `https://placehold.co/150x150/e2e8f0/475569?text=${encodeURIComponent(newName.split(' ').slice(0, 2).join('+'))}`;
    const newItem: Item = { id: Date.now().toString(), name: newName, description: newDescription, link: newLink, imageUrl: finalImageUrl };
    updateCurrentList({ items: [...currentList.items, newItem] });
    setNewName(''); setNewLink(''); setNewDescription(''); setNewImageUrl(null);
  };

  const saveEditItem = () => {
    if (!editItemData.name || !editItemData.description) return alert("Nome e justificativa são obrigatórios.");
    const updatedItems = currentList.items.map(i => i.id === editingItemId ? { ...i, ...editItemData } as Item : i);
    updateCurrentList({ items: updatedItems });
    setEditingItemId(null);
  };

  const deleteItem = (id: string) => {
    if (confirm("Deletar este item?")) {
      updateCurrentList({ items: currentList.items.filter(i => i.id !== id) });
    }
  };

  const getGoogleImagesUrl = (query: string) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-800 print:bg-white">
      
      {/* Top Navigation Bar (Hidden in Print) */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center print:hidden sticky top-0 z-40 shadow-sm">
        <div className="relative">
          <button 
            onClick={() => setIsListSelectorOpen(!isListSelectorOpen)}
            className="flex items-center gap-2 font-semibold text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
          >
            <ListIcon size={20} />
            <span className="max-w-[200px] truncate">{currentList.title}</span>
            <ChevronDown size={16} />
          </button>
          
          {isListSelectorOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden z-50">
              <div className="max-h-60 overflow-y-auto">
                {lists.map(list => (
                  <div 
                    key={list.id} 
                    className={`flex justify-between items-center px-4 py-3 hover:bg-gray-50 cursor-pointer ${currentListId === list.id ? 'bg-blue-50 text-blue-700' : ''}`}
                    onClick={() => { setCurrentListId(list.id); setIsListSelectorOpen(false); }}
                  >
                    <span className="truncate">{list.title}</span>
                    {lists.length > 1 && (
                      <button onClick={(e) => deleteList(list.id, e)} className="text-gray-400 hover:text-red-500 p-1 rounded">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 p-2">
                <button onClick={createNewList} className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:bg-blue-50 py-2 rounded-lg transition font-medium">
                  <Plus size={16} /> Nova Lista
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsThemePanelOpen(!isThemePanelOpen)}
            className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
          >
            <Palette size={18} /> <span className="hidden sm:inline">Personalizar</span>
          </button>
          <button 
            onClick={() => window.print()} 
            className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-800 transition flex items-center gap-2"
          >
            <Printer size={18} /> <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Document Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible">
          <datalist id="historical-names">
            {allHistoricalNames.map((name, i) => <option key={i} value={name} />)}
          </datalist>

          <div 
            className="max-w-4xl mx-auto p-8 md:p-12 shadow-lg rounded-lg print:shadow-none print:p-0 print:max-w-full print:m-0 transition-colors duration-300"
            style={{ backgroundColor: currentList.theme.bgColor, color: currentList.theme.textColor }}
          >
            {/* Header */}
            <div className="mb-8 border-b-2 pb-4" style={{ borderColor: currentList.theme.textColor }}>
              <input 
                type="text"
                value={currentList.title}
                onChange={(e) => updateCurrentList({ title: e.target.value })}
                className="w-full bg-transparent outline-none font-bold uppercase tracking-wide placeholder-opacity-50"
                style={{ 
                  fontFamily: currentList.theme.titleFont, 
                  fontSize: currentList.theme.titleSize,
                  color: currentList.theme.textColor 
                }}
                placeholder="Título da Lista"
              />
            </div>

            {/* List */}
            <div className="space-y-6">
              {currentList.items.map(item => (
                <div key={item.id} className="border-b pb-6 mb-6 last:border-0 print:break-inside-avoid group" style={{ borderColor: `${currentList.theme.textColor}33` }}>
                  
                  {editingItemId === item.id ? (
                    /* Edit Mode */
                    <div className="bg-black/5 p-4 rounded-lg print:hidden">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold">Editando Item</h3>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingItemId(null)} className="text-gray-500 hover:text-gray-700"><X size={20}/></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <input type="text" value={editItemData.name || ''} onChange={e => setEditItemData({...editItemData, name: e.target.value})} placeholder="Nome" className="p-2 border rounded w-full bg-white text-gray-900" />
                        <input type="text" value={editItemData.link || ''} onChange={e => setEditItemData({...editItemData, link: e.target.value})} placeholder="Link" className="p-2 border rounded w-full bg-white text-gray-900" />
                        
                        <div className="relative">
                          <textarea value={editItemData.description || ''} onChange={e => setEditItemData({...editItemData, description: e.target.value})} placeholder="Descrição" className="p-2 border rounded w-full bg-white text-gray-900 pr-10" rows={3} />
                          <button 
                            onClick={() => generateDescription(editItemData.name || '', aiCharLimit, (desc) => setEditItemData({...editItemData, description: desc}))}
                            disabled={isGeneratingDesc}
                            className="absolute top-2 right-2 text-purple-600 hover:bg-purple-50 p-1 rounded transition"
                            title="Gerar com IA"
                          >
                            {isGeneratingDesc ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <img src={editItemData.imageUrl || item.imageUrl} className="w-16 h-16 object-cover rounded border" alt="preview" />
                          <div className="flex flex-wrap gap-2">
                            <label className="cursor-pointer text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1.5 rounded hover:bg-blue-100 flex items-center gap-1">
                              <Upload size={14}/> Upload
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, (url) => setEditItemData({...editItemData, imageUrl: url}))} />
                            </label>
                            <button 
                              onClick={async () => {
                                setIsGeneratingImage(true);
                                const url = await generateImageWithAI(editItemData.name || '', editItemData.description || '');
                                if (url) setEditItemData({...editItemData, imageUrl: url});
                                setIsGeneratingImage(false);
                              }}
                              disabled={isGeneratingImage}
                              className="text-xs bg-purple-50 text-purple-600 border border-purple-200 px-2 py-1.5 rounded hover:bg-purple-100 flex items-center gap-1 disabled:opacity-50"
                            >
                              {isGeneratingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14}/>} IA
                            </button>
                            <a 
                              href={getGoogleImagesUrl(editItemData.name || item.name)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-1.5 rounded hover:bg-green-100 flex items-center gap-1 transition"
                            >
                              <ExternalLink size={14}/> Google
                            </a>
                          </div>
                        </div>

                        <button onClick={saveEditItem} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2">
                          <Save size={18} /> Salvar Alterações
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="relative">
                      <div className="absolute top-0 right-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition flex gap-2 print:hidden">
                        <button onClick={() => { setEditingItemId(item.id); setEditItemData(item); }} className="p-2 bg-white/90 backdrop-blur rounded shadow-sm text-gray-600 hover:text-blue-600 border border-gray-200 active:bg-gray-100"><Edit2 size={18}/></button>
                        <button onClick={() => deleteItem(item.id)} className="p-2 bg-white/90 backdrop-blur rounded shadow-sm text-gray-600 hover:text-red-600 border border-gray-200 active:bg-gray-100"><Trash2 size={18}/></button>
                      </div>

                      <h2 
                        className="font-semibold mb-3 pr-20"
                        style={{ fontFamily: currentList.theme.itemTitleFont, fontSize: currentList.theme.itemTitleSize }}
                      >
                        {item.name}
                      </h2>
                      
                      <div className="flex flex-row gap-4 items-start">
                        <div className="relative cursor-pointer shrink-0" onClick={() => setExpandedImage(item.imageUrl)}>
                          <img src={item.imageUrl} alt={item.name} className="w-16 h-16 md:w-20 md:h-20 object-cover rounded border shadow-sm hover:opacity-90 transition" style={{ borderColor: `${currentList.theme.textColor}33` }} referrerPolicy="no-referrer" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="leading-relaxed opacity-90" style={{ fontFamily: currentList.theme.descFont, fontSize: currentList.theme.descSize }}>
                            {item.description}
                          </p>
                          {item.link && (
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline text-sm break-all block mt-2 opacity-80" style={{ color: currentList.theme.accentColor }}>
                              {item.link}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Form */}
            <div className="print:hidden mt-12 p-6 rounded-xl border shadow-sm" style={{ backgroundColor: `${currentList.theme.textColor}08`, borderColor: `${currentList.theme.textColor}22` }}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: currentList.theme.titleFont }}>
                <Plus size={20} /> Adicionar Novo Item
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  list="historical-names"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Nome do Produto" 
                  className="p-3 border rounded-lg w-full outline-none transition bg-white/90 text-gray-900 focus:ring-2"
                  style={{ borderColor: `${currentList.theme.textColor}33` }}
                />
                <input 
                  type="text" 
                  value={newLink}
                  onChange={e => setNewLink(e.target.value)}
                  placeholder="Link (Opcional)" 
                  className="p-3 border rounded-lg w-full outline-none transition bg-white/90 text-gray-900 focus:ring-2"
                  style={{ borderColor: `${currentList.theme.textColor}33` }}
                />
                
                <div className="md:col-span-2 relative">
                  <textarea 
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Justificativa / Descrição" 
                    className="p-3 border rounded-lg w-full outline-none transition bg-white/90 text-gray-900 focus:ring-2" 
                    rows={3}
                    style={{ borderColor: `${currentList.theme.textColor}33` }}
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-2">
                    <div className="flex items-center gap-2 text-sm opacity-70">
                      <span>Limite IA: {aiCharLimit}</span>
                      <input type="range" min="50" max="1000" step="50" value={aiCharLimit} onChange={e => setAiCharLimit(Number(e.target.value))} className="w-24" />
                      <span>({newDescription.length} chars)</span>
                    </div>
                    <button 
                      onClick={() => generateDescription(newName, aiCharLimit, setNewDescription)}
                      disabled={isGeneratingDesc || !newName}
                      className="text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 transition disabled:opacity-50 text-white"
                      style={{ backgroundColor: currentList.theme.accentColor }}
                    >
                      {isGeneratingDesc ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                      Gerar Descrição IA
                    </button>
                  </div>
                </div>
                
                <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 items-start p-4 rounded-lg border" style={{ backgroundColor: `${currentList.theme.bgColor}88`, borderColor: `${currentList.theme.textColor}22` }}>
                  <div className="shrink-0">
                    {newImageUrl ? (
                      <div className="relative group">
                        <img src={newImageUrl} alt="Preview" className="w-24 h-24 object-cover rounded border border-gray-200" />
                        <button onClick={() => setNewImageUrl(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"><X size={14}/></button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded border flex flex-col items-center justify-center gap-1 opacity-50" style={{ borderColor: `${currentList.theme.textColor}33` }}>
                        <ImageIcon size={24} />
                        <span className="text-[10px] uppercase tracking-wider">Sem Imagem</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 w-full">
                    <p className="text-sm font-medium opacity-80">Imagem do Produto (Opcional)</p>
                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer text-sm bg-white/50 border px-3 py-2 rounded-lg hover:bg-white/80 flex items-center gap-2 transition text-gray-800 border-gray-300">
                        <Upload size={16}/> Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setNewImageUrl)} />
                      </label>
                      
                      <button 
                        onClick={async () => {
                          if (!newName) return alert("Preencha o nome primeiro.");
                          setIsGeneratingImage(true);
                          const url = await generateImageWithAI(newName, newDescription);
                          if (url) setNewImageUrl(url);
                          setIsGeneratingImage(false);
                        }}
                        disabled={isGeneratingImage || !newName}
                        className="text-sm bg-white/50 border px-3 py-2 rounded-lg hover:bg-white/80 flex items-center gap-2 transition text-gray-800 border-gray-300 disabled:opacity-50"
                      >
                        {isGeneratingImage ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16}/>} IA
                      </button>

                      {newName && (
                        <a 
                          href={getGoogleImagesUrl(newName)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm bg-white/50 border px-3 py-2 rounded-lg hover:bg-white/80 flex items-center gap-2 transition text-gray-800 border-gray-300"
                        >
                          <ExternalLink size={16}/> Google
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 mt-2">
                  <button 
                    onClick={handleAddItem}
                    className="w-full text-white px-4 py-3 rounded-lg transition flex items-center justify-center gap-2 font-medium text-lg shadow-sm hover:opacity-90"
                    style={{ backgroundColor: currentList.theme.textColor }}
                  >
                    <Plus size={20} /> Adicionar à Lista
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Theme Customizer Drawer */}
        {isThemePanelOpen && (
          <div className="w-80 bg-white border-l border-gray-200 shadow-2xl flex flex-col print:hidden z-30">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><Palette size={18}/> Personalizar</h2>
              <button onClick={() => setIsThemePanelOpen(false)} className="text-gray-500 hover:text-gray-800"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Presets */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Presets</h3>
                <div className="grid grid-cols-1 gap-2">
                  {THEME_PRESETS.map(preset => (
                    <button 
                      key={preset.id}
                      onClick={() => updateCurrentList({ theme: preset })}
                      className="flex items-center gap-3 p-2 rounded border hover:border-blue-400 transition"
                      style={{ borderColor: currentList.theme.id === preset.id ? '#3b82f6' : '#e5e7eb' }}
                    >
                      <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: preset.bgColor }}></div>
                      <span className="text-sm font-medium text-gray-700">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Colors */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Cores (Custom)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Fundo</span>
                    <input type="color" value={currentList.theme.bgColor} onChange={e => updateCurrentList({ theme: { ...currentList.theme, id: 'custom', bgColor: e.target.value } })} className="w-8 h-8 rounded cursor-pointer" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Texto</span>
                    <input type="color" value={currentList.theme.textColor} onChange={e => updateCurrentList({ theme: { ...currentList.theme, id: 'custom', textColor: e.target.value } })} className="w-8 h-8 rounded cursor-pointer" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Destaque</span>
                    <input type="color" value={currentList.theme.accentColor} onChange={e => updateCurrentList({ theme: { ...currentList.theme, id: 'custom', accentColor: e.target.value } })} className="w-8 h-8 rounded cursor-pointer" />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Typography */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Tipografia</h3>
                
                <div className="space-y-4">
                  {/* Title */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <label className="block text-xs font-medium text-gray-500 mb-2">Título da Lista</label>
                    <div className="flex gap-2">
                      <select value={currentList.theme.titleFont} onChange={e => updateCurrentList({ theme: { ...currentList.theme, id: 'custom', titleFont: e.target.value } })} className="flex-1 text-sm border rounded p-1">
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <select value={currentList.theme.titleSize} onChange={e => updateCurrentList({ theme: { ...currentList.theme, id: 'custom', titleSize: e.target.value } })} className="w-20 text-sm border rounded p-1">
                        {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Item Title */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <label className="block text-xs font-medium text-gray-500 mb-2">Nome do Item</label>
                    <div className="flex gap-2">
                      <select value={currentList.theme.itemTitleFont} onChange={e => updateCurrentList({ theme: { ...currentList.theme, id: 'custom', itemTitleFont: e.target.value } })} className="flex-1 text-sm border rounded p-1">
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <select value={currentList.theme.itemTitleSize} onChange={e => updateCurrentList({ theme: { ...currentList.theme, id: 'custom', itemTitleSize: e.target.value } })} className="w-20 text-sm border rounded p-1">
                        {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <label className="block text-xs font-medium text-gray-500 mb-2">Descrição</label>
                    <div className="flex gap-2">
                      <select value={currentList.theme.descFont} onChange={e => updateCurrentList({ theme: { ...currentList.theme, id: 'custom', descFont: e.target.value } })} className="flex-1 text-sm border rounded p-1">
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <select value={currentList.theme.descSize} onChange={e => updateCurrentList({ theme: { ...currentList.theme, id: 'custom', descSize: e.target.value } })} className="w-20 text-sm border rounded p-1">
                        {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Lightbox Modal */}
      {expandedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 print:hidden backdrop-blur-sm" onClick={() => setExpandedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <button className="absolute -top-12 right-0 text-white hover:text-gray-300 transition bg-black/50 rounded-full p-2" onClick={() => setExpandedImage(null)}><X size={24} /></button>
            <img src={expandedImage} alt="Expanded view" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} referrerPolicy="no-referrer" />
          </div>
        </div>
      )}
    </div>
  );
}
