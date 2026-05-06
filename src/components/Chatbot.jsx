import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, X, Send } from 'lucide-react';

const Chatbot = () => {
  const { services, orders } = useData();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: `Xin chào ${user?.name}! Tôi là trợ lý ảo. Bạn có thể hỏi tôi về danh sách dịch vụ, giá tiền${user?.role === 'admin' ? ', hoặc doanh thu trong ngày' : ''}.` }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');

    setTimeout(() => {
      const response = generateResponse(userText.toLowerCase());
      setMessages(prev => [...prev, { sender: 'bot', text: response }]);
    }, 500);
  };

  const generateResponse = (text) => {
    // 1. Kiểm tra hỏi về doanh thu
    if (text.includes('doanh thu') || text.includes('tiền')) {
      if (user?.role === 'admin') {
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
        const todayTotal = todayOrders.reduce((sum, o) => sum + o.totalPrice, 0);
        return `Doanh thu trong ngày hôm nay (${new Date().toLocaleDateString('vi-VN')}) là: ${todayTotal.toLocaleString()} đ.`;
      } else {
        return "Xin lỗi, chỉ có tài khoản Admin mới có quyền xem thông tin doanh thu.";
      }
    }

    // 2. Hỏi chung về dịch vụ hoặc giá
    if (text.includes('dịch vụ') || text.includes('giá') || text.includes('menu') || text.includes('bảng giá')) {
      if (services.length === 0) return "Hiện tại hệ thống chưa có cấu hình dịch vụ nào. Admin cần thêm dịch vụ trước.";
      const list = services.map(s => `- ${s.name}: ${s.price.toLocaleString()} đ/kg`).join('\n');
      return `Đây là bảng giá dịch vụ hiện hành của tiệm:\n${list}`;
    }

    // 3. Kiểm tra giá dịch vụ cụ thể
    const foundService = services.find(s => text.includes(s.name.toLowerCase()));
    if (foundService) {
      return `Giá của dịch vụ "${foundService.name}" đang là ${foundService.price.toLocaleString()} đ/kg.`;
    }

    // 4. Mặc định
    return "Tôi chưa hiểu ý bạn. Bạn có thể hỏi tôi về:\n- Xem bảng giá / dịch vụ\n- Giá của 1 dịch vụ cụ thể" + (user?.role === 'admin' ? "\n- Doanh thu hôm nay" : "");
  };

  if (!user) return null; // Ẩn bot nếu chưa đăng nhập

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      {!isOpen && (
        <button 
          className="btn btn-primary" 
          style={{ width: '56px', height: '56px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare size={28} />
        </button>
      )}

      {isOpen && (
        <div className="card" style={{ width: '340px', height: '480px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="font-semibold flex items-center gap-2">
              <MessageSquare size={20} /> Trợ lý AI
            </div>
            <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.25rem' }} onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-main)' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'white',
                color: msg.sender === 'user' ? 'white' : 'var(--text-main)',
                padding: '0.75rem 1rem',
                borderRadius: '1rem',
                borderBottomRightRadius: msg.sender === 'user' ? '0' : '1rem',
                borderBottomLeftRadius: msg.sender === 'bot' ? '0' : '1rem',
                maxWidth: '85%',
                boxShadow: 'var(--shadow-sm)',
                whiteSpace: 'pre-line',
                fontSize: '0.875rem',
                lineHeight: '1.4'
              }}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={{ display: 'flex', padding: '0.75rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'white' }}>
            <input 
              type="text" 
              placeholder="Nhập câu hỏi (VD: giá dịch vụ, doanh thu...)" 
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', padding: '0 0.5rem', fontSize: '0.875rem' }}
            />
            <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}>
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
