const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function seed() {
  console.log('Đang kiểm tra và khởi tạo dữ liệu mẫu...');

  // 1. Kiểm tra xem có admin nào chưa
  const { data: users, error: userError } = await supabase.from('users').select('id').limit(1);
  
  if (userError) {
    console.error('Lỗi khi truy cập bảng users:', userError.message);
    console.log('Hãy đảm bảo bạn đã tạo bảng users trong Supabase.');
    return;
  }

  if (users.length === 0) {
    console.log('Đang tạo tài khoản Admin mặc định...');
    const { data, error } = await supabase.from('users').insert([
      {
        email: 'admin@test.com',
        password: '123', // Trong thực tế nên dùng hash
        role: 'admin',
        name: 'Chủ Tiệm',
        branchIds: '[]',
        salaryType: 'fulltime'
      }
    ]).select();

    if (error) {
      console.error('Lỗi khi tạo admin:', error.message);
    } else {
      console.log('Đã tạo tài khoản Admin thành công!');
      console.log('Email: admin@test.com');
      console.log('Password: 123');
    }
  } else {
    console.log('Đã có dữ liệu trong bảng users, không cần khởi tạo.');
  }

  // 2. Tạo một chi nhánh mẫu nếu chưa có
  const { data: branches } = await supabase.from('branches').select('id').limit(1);
  if (branches && branches.length === 0) {
    console.log('Đang tạo chi nhánh mẫu...');
    await supabase.from('branches').insert([
      { name: 'Cơ sở chính', address: 'Số 1, Đường chính', adminId: 1 }
    ]);
    console.log('Đã tạo chi nhánh mẫu.');
  }
}

seed();
