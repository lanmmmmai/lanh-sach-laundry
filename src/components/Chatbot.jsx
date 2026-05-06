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
    const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove accents
    
    // Helper function to check if any keyword matches
    const hasAny = (keywords) => keywords.some(k => t.includes(k));

    // 1. Chào hỏi
    if (hasAny(['chao', 'hello', 'hi ', 'oi', 'bot'])) {
      return `Chào ${user?.name}! Tôi là trợ lý ảo AI của hệ thống. Tôi có thể cung cấp thông tin về Dịch vụ, Cơ sở, Doanh thu, hoặc hướng dẫn sử dụng phần mềm. Bạn cần giúp gì ạ?`;
    }

    // 2. Doanh thu (Chỉ Admin)
    if (hasAny(['doanh thu', 'tien thu', 'ban duoc', 'thu nhap', 'tong tien'])) {
      if (user?.role !== 'admin') {
        return "Rất tiếc, thông tin doanh thu là dữ liệu bảo mật. Chỉ có tài khoản Quản trị viên (Admin) mới có quyền truy cập thông tin này.";
      }
      
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
      const todayTotal = todayOrders.reduce((sum, o) => sum + o.totalPrice, 0);
      const orderCount = todayOrders.length;
      
      return `📊 Doanh thu ngày hôm nay (${new Date().toLocaleDateString('vi-VN')}):\n- Số đơn hàng: ${orderCount} đơn\n- Tổng doanh thu: ${todayTotal.toLocaleString()} VNĐ.\nBạn có thể vào mục "Tổng quan" để xem chi tiết biểu đồ.`;
    }

    // 3. Hệ thống cơ sở (Branches)
    if (hasAny(['co so', 'dia chi', 'o dau', 'chi nhanh', 'cua hang'])) {
      // Need to grab branches from context... wait, Chatbot doesn't have `branches`. Let's assume we can add it.
      return "Hệ thống hiện quản lý các cơ sở trong mục 'Cơ sở' ở menu bên trái. Bạn có thể vào đó để xem địa chỉ cụ thể của từng chi nhánh.";
    }

    // 4. Hướng dẫn sử dụng (Usage)
    if (hasAny(['cach', 'huong dan', 'tao don', 'them', 'lam sao'])) {
      if (t.includes('tao don') || t.includes('don hang')) {
        return "💡 Để tạo đơn hàng mới:\n1. Chọn 'Tạo đơn mới' ở menu.\n2. Nhập thông tin khách hàng (SĐT/Tên).\n3. Chọn dịch vụ & cân nặng.\n4. Bấm 'Lưu đơn hàng'.";
      }
      if (t.includes('cham cong') || t.includes('ca lam')) {
        return "💡 Để chấm công:\n1. Vào mục 'Chấm công của tôi'.\n2. Bấm 'Bắt đầu ca mới' và chọn Ca làm việc.\n3. Khi kết thúc, nhớ bấm 'Check Out'.";
      }
      return "💡 Bạn có thể thao tác dễ dàng qua menu bên trái. Quản lý Đơn hàng, Dịch vụ, Nhân sự và Chấm công đều có các nút 'Thêm mới' rõ ràng.";
    }

    // 5. Tìm giá một dịch vụ cụ thể
    const normalizedServices = services.map(s => ({ 
      ...s, 
      normName: s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    }));
    
    const specificService = normalizedServices.find(s => t.includes(s.normName) && s.normName.length > 3);
    if (specificService) {
      return `✨ Dịch vụ "${specificService.name}" hiện đang có mức giá là ${specificService.price.toLocaleString()} VNĐ / ${specificService.unit}.\nBạn có cần thêm thông tin dịch vụ nào khác không?`;
    }

    // 6. Hỏi chung về dịch vụ hoặc bảng giá
    if (hasAny(['dich vu', 'gia', 'menu', 'bang gia', 'bao nhieu', 'giat', 'say'])) {
      if (services.length === 0) return "Hiện tại hệ thống chưa cập nhật dịch vụ nào. Quản trị viên cần thêm dịch vụ vào hệ thống trước.";
      const list = services.slice(0, 5).map(s => `• ${s.name}: ${s.price.toLocaleString()} đ/${s.unit}`).join('\n');
      return `📋 Dưới đây là bảng giá một số dịch vụ nổi bật:\n${list}\n${services.length > 5 ? '...vào mục "Dịch vụ" để xem toàn bộ.' : ''}`;
    }

    // 7. Hỏi về tình trạng đơn hàng
    if (hasAny(['don hang', 'tinh trang', 'kiem tra don'])) {
      return "📦 Để kiểm tra trạng thái đơn hàng, vui lòng vào tab 'Đơn hàng' ở menu bên trái. Bạn có thể tìm kiếm theo Tên hoặc Số điện thoại khách hàng.";
    }

    // 8. Cảm ơn
    if (hasAny(['cam on', 'thank', 'ok', 'da hieu'])) {
      return "Không có chi! Nếu cần hỗ trợ thêm, tôi luôn ở đây. Chúc bạn một ngày làm việc hiệu quả! 🌟";
    }

    // 9. Mặc định
    return "Xin lỗi, tôi chưa hiểu rõ ý của bạn. Bạn vui lòng dùng từ khóa ngắn gọn hơn, ví dụ:\n👉 'Doanh thu hôm nay'\n👉 'Bảng giá dịch vụ'\n👉 'Cách tạo đơn hàng'\n👉 'Địa chỉ chi nhánh'\nTôi sẽ cố gắng trả lời chính xác nhất!";
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
