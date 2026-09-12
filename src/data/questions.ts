export interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
}

export const questions: Question[] = [
  {
    id: 1,
    question: "Nguyên tử gồm những phần nào?",
    options: [
      "Hạt nhân và lớp vỏ electron",
      "Proton và neutron",
      "Electron và neutron",
      "Proton và electron"
    ],
    answer: "Hạt nhân và lớp vỏ electron"
  },
  {
    id: 2,
    question: "Hạt nhân nguyên tử gồm những hạt nào?",
    options: [
      "Proton và neutron",
      "Proton và electron",
      "Electron và neutron",
      "Chỉ có proton"
    ],
    answer: "Proton và neutron"
  },
  {
    id: 3,
    question: "Electron nằm ở đâu trong nguyên tử?",
    options: [
      "Chuyển động quanh hạt nhân tạo thành lớp vỏ electron",
      "Nằm trong hạt nhân cùng với proton",
      "Đứng yên ở lớp vỏ nguyên tử",
      "Nằm xen kẽ giữa các proton"
    ],
    answer: "Chuyển động quanh hạt nhân tạo thành lớp vỏ electron"
  },
  {
    id: 4,
    question: "Proton mang điện tích gì?",
    options: ["+1e", "-1e", "Không mang điện", "+2e"],
    answer: "+1e"
  },
  {
    id: 5,
    question: "Electron mang điện tích gì?",
    options: ["-1e", "+1e", "Không mang điện", "-2e"],
    answer: "-1e"
  },
  {
    id: 6,
    question: "Neutron mang điện tích gì?",
    options: ["Không mang điện", "+1e", "-1e", "+2e"],
    answer: "Không mang điện"
  },
  {
    id: 7,
    question: "Hạt nào trong nguyên tử có khối lượng nhỏ nhất?",
    options: ["Electron", "Proton", "Neutron", "Hạt nhân"],
    answer: "Electron"
  },
  {
    id: 8,
    question: "Hầu hết khối lượng nguyên tử tập trung ở đâu?",
    options: ["Hạt nhân", "Lớp vỏ electron", "Quỹ đạo electron", "Cả hạt nhân và lớp vỏ"],
    answer: "Hạt nhân"
  },
  {
    id: 9,
    question: "Trong nguyên tử trung hòa về điện, số proton và electron có quan hệ gì?",
    options: [
      "Số proton = số electron",
      "Số proton > số electron",
      "Số proton < số electron",
      "Số proton + số electron = số neutron"
    ],
    answer: "Số proton = số electron"
  },
  {
    id: 10,
    question: "Số proton trong hạt nhân nguyên tử còn được gọi là gì?",
    options: ["Điện tích hạt nhân (Z)", "Số khối (A)", "Số neutron (N)", "Nguyên tử khối (M)"],
    answer: "Điện tích hạt nhân (Z)"
  },
  {
    id: 11,
    question: "Công thức tính số khối (A) của nguyên tử?",
    options: ["A = Z + N", "A = Z - N", "A = Z × N", "A = N - Z"],
    answer: "A = Z + N"
  },
  {
    id: 12,
    question: "Công thức tính số neutron (N) của nguyên tử?",
    options: ["N = A - Z", "N = A + Z", "N = Z - A", "N = A × Z"],
    answer: "N = A - Z"
  },
  {
    id: 13,
    question: "Kích thước của nguyên tử khoảng bao nhiêu?",
    options: ["Khoảng 10⁻¹⁰ m", "Khoảng 10⁻¹⁵ m", "Khoảng 10⁻⁵ m", "Khoảng 10⁻²⁰ m"],
    answer: "Khoảng 10⁻¹⁰ m"
  },
  {
    id: 14,
    question: "Kích thước của hạt nhân nguyên tử khoảng bao nhiêu?",
    options: ["Khoảng 10⁻¹⁵ m", "Khoảng 10⁻¹⁰ m", "Khoảng 10⁻⁵ m", "Khoảng 10⁻²⁰ m"],
    answer: "Khoảng 10⁻¹⁵ m"
  },
  {
    id: 15,
    question: "Phần lớn thể tích của nguyên tử là gì?",
    options: ["Khoảng trống", "Hạt nhân nguyên tử", "Các electron", "Các hạt proton"],
    answer: "Khoảng trống"
  },
  {
    id: 16,
    question: "Nguyên tố hóa học là gì?",
    options: [
      "Tập hợp các nguyên tử có cùng số proton",
      "Tập hợp các nguyên tử có cùng số neutron",
      "Tập hợp các nguyên tử có cùng số khối",
      "Tập hợp các nguyên tử có cùng phân lớp electron"
    ],
    answer: "Tập hợp các nguyên tử có cùng số proton"
  },
  {
    id: 17,
    question: "Số hiệu nguyên tử (Z) cho biết thông tin gì?",
    options: [
      "Số proton trong hạt nhân",
      "Tổng số proton và neutron",
      "Số lượng đồng vị",
      "Vị trí của lớp electron ngoài cùng"
    ],
    answer: "Số proton trong hạt nhân"
  },
  {
    id: 18,
    question: "Đại lượng nào quyết định bản chất của nguyên tố hóa học?",
    options: ["Số hiệu nguyên tử (Z)", "Số khối (A)", "Số neutron (N)", "Nguyên tử khối (M)"],
    answer: "Số hiệu nguyên tử (Z)"
  },
  {
    id: 19,
    question: "Kí hiệu chuẩn của nguyên tử được viết như thế nào?",
    options: ["A trên, Z dưới (ᴀZX)", "Z trên, A dưới (ᴢAX)", "A và Z nằm cùng một hàng ngang", "Chỉ cần viết kí hiệu hóa học (X)"],
    answer: "A trên, Z dưới (ᴀZX)"
  },
  {
    id: 20,
    question: "Đồng vị là gì?",
    options: [
      "Các nguyên tử cùng số proton (Z) nhưng khác số neutron (N)",
      "Các nguyên tử cùng số neutron (N) nhưng khác số khối (A)",
      "Các nguyên tử cùng số khối (A) nhưng khác số proton (Z)",
      "Các phân tử có cùng công thức hóa học nhưng khác cấu tạo"
    ],
    answer: "Các nguyên tử cùng số proton (Z) nhưng khác số neutron (N)"
  },
  {
    id: 21,
    question: "Các đồng vị của cùng một nguyên tố hóa học có tính chất như thế nào?",
    options: [
      "Gần như giống nhau về tính chất hóa học",
      "Hoàn toàn khác nhau về tính chất hóa học",
      "Giống hệt nhau về tính chất vật lý",
      "Chỉ phản ứng được với các chất ở dạng khí"
    ],
    answer: "Gần như giống nhau về tính chất hóa học"
  },
  {
    id: 22,
    question: "Nguyên tử khối là đại lượng nào?",
    options: [
      "Khối lượng tương đối của nguyên tử",
      "Khối lượng tuyệt đối của nguyên tử tính bằng gam",
      "Số lượng các hạt mang điện trong nguyên tử",
      "Tổng khối lượng của tất cả electron"
    ],
    answer: "Khối lượng tương đối của nguyên tử"
  },
  {
    id: 23,
    question: "Đơn vị dùng để đo khối lượng nguyên tử (amu) là gì?",
    options: ["u", "g", "kg", "mol"],
    answer: "u"
  },
  {
    id: 24,
    question: "Giá trị 1u tương đương với đại lượng nào?",
    options: [
      "1/12 khối lượng nguyên tử đồng vị carbon-12",
      "1/16 khối lượng nguyên tử oxygen-16",
      "Khối lượng của 1 proton",
      "Khối lượng của 1 electron"
    ],
    answer: "1/12 khối lượng nguyên tử đồng vị carbon-12"
  },
  {
    id: 25,
    question: "Nguyên tử khối trung bình của một nguyên tố phụ thuộc vào những yếu tố nào?",
    options: [
      "Khối lượng và phần trăm số nguyên tử của các đồng vị",
      "Số hiệu nguyên tử và số nơtron",
      "Khối lượng hạt nhân và lớp vỏ electron",
      "Số lớp electron và mức năng lượng"
    ],
    answer: "Khối lượng và phần trăm số nguyên tử của các đồng vị"
  },
  {
    id: 26,
    question: "Nguyên tố Carbon trong tự nhiên có những đồng vị phổ biến nào?",
    options: ["¹²C, ¹³C, ¹⁴C", "¹¹C, ¹²C, ¹³C", "¹²C, ¹⁴C, ¹⁶C", "¹⁴C, ¹⁵C, ¹⁶C"],
    answer: "¹²C, ¹³C, ¹⁴C"
  },
  {
    id: 27,
    question: "Đồng vị phóng xạ có ứng dụng trong những lĩnh vực nào?",
    options: [
      "Y học, khảo cổ học, nghiên cứu khoa học",
      "Chỉ dùng trong công nghiệp điện hạt nhân",
      "Sản xuất năng lượng điện phân",
      "Tổng hợp chất dẻo hữu cơ"
    ],
    answer: "Y học, khảo cổ học, nghiên cứu khoa học"
  },
  {
    id: 28,
    question: "Electron ở lớp vỏ nguyên tử được sắp xếp vào đâu?",
    options: [
      "Các lớp electron",
      "Nằm lộn xộn quanh hạt nhân",
      "Cùng chung một mức năng lượng",
      "Nằm bên trong hạt nhân"
    ],
    answer: "Các lớp electron"
  },
  {
    id: 29,
    question: "Các lớp electron từ trong ra ngoài lần lượt được ký hiệu là gì?",
    options: ["K, L, M, N, O, P, Q", "A, B, C, D, E", "X, Y, Z", "s, p, d, f"],
    answer: "K, L, M, N, O, P, Q"
  },
  {
    id: 30,
    question: "Đối với nguyên tố thuộc nhóm A, số lớp electron bằng đại lượng nào trong bảng tuần hoàn?",
    options: [
      "Số chu kì",
      "Số thứ tự ô nguyên tố",
      "Số nhóm",
      "Điện tích hạt nhân"
    ],
    answer: "Số chu kì"
  },
  {
    id: 31,
    question: "Mỗi lớp electron được chia thành các phần nhỏ hơn gọi là gì?",
    options: ["Một hay nhiều phân lớp", "Orbital hạt nhân", "Các hạt proton", "Các đám mây ion"],
    answer: "Một hay nhiều phân lớp"
  },
  {
    id: 32,
    question: "Các phân lớp electron được ký hiệu bằng những chữ cái nào?",
    options: ["s, p, d, f", "K, L, M, N", "A, B, C, D", "x, y, z, t"],
    answer: "s, p, d, f"
  },
  {
    id: 33,
    question: "Phân lớp s chứa tối đa bao nhiêu electron?",
    options: ["2 electron", "6 electron", "10 electron", "14 electron"],
    answer: "2 electron"
  },
  {
    id: 34,
    question: "Phân lớp p chứa tối đa bao nhiêu electron?",
    options: ["6 electron", "2 electron", "10 electron", "14 electron"],
    answer: "6 electron"
  },
  {
    id: 35,
    question: "Phân lớp d chứa tối đa bao nhiêu electron?",
    options: ["10 electron", "6 electron", "14 electron", "18 electron"],
    answer: "10 electron"
  },
  {
    id: 36,
    question: "Phân lớp f chứa tối đa bao nhiêu electron?",
    options: ["14 electron", "10 electron", "18 electron", "32 electron"],
    answer: "14 electron"
  },
  {
    id: 37,
    question: "Các electron được điền vào các phân lớp theo nguyên lí nào?",
    options: [
      "Nguyên lí vững bền (từ mức năng lượng thấp đến cao)",
      "Quy tắc bất định Heisenberg",
      "Định luật bảo toàn khối lượng",
      "Nguyên lí loại trừ Pauli"
    ],
    answer: "Nguyên lí vững bền (từ mức năng lượng thấp đến cao)"
  },
  {
    id: 38,
    question: "Nguyên lí Pauli phát biểu thế nào?",
    options: [
      "Một AO chứa tối đa 2 electron và có chiều tự quay (spin) ngược nhau",
      "Các electron phải điền đầy vào phân lớp s trước khi điền vào phân lớp p",
      "Electron phải chuyển động quanh hạt nhân theo hình elip",
      "Các electron sẽ có xu hướng ghép đôi sớm nhất có thể"
    ],
    answer: "Một AO chứa tối đa 2 electron và có chiều tự quay (spin) ngược nhau"
  },
  {
    id: 39,
    question: "Quy tắc Hund áp dụng cho việc điền electron như thế nào?",
    options: [
      "Trong cùng phân lớp, electron phân bố sao cho số electron độc thân là lớn nhất",
      "Điền đầy các orbital từ ngoài vào trong",
      "Tất cả các electron trong một nguyên tử đều phải ghép đôi",
      "Electron không được đứng độc thân"
    ],
    answer: "Trong cùng phân lớp, electron phân bố sao cho số electron độc thân là lớn nhất"
  },
  {
    id: 40,
    question: "Đặc điểm nào quyết định tính chất hóa học cơ bản của nguyên tố?",
    options: [
      "Số electron lớp ngoài cùng",
      "Tổng số hạt trong hạt nhân",
      "Số lớp electron",
      "Kích thước nguyên tử"
    ],
    answer: "Số electron lớp ngoài cùng"
  },
  {
    id: 41,
    question: "Các nguyên tử khí hiếm (ngoại trừ Helium) thường có bao nhiêu electron ở lớp ngoài cùng?",
    options: ["8 electron", "2 electron", "4 electron", "6 electron"],
    answer: "8 electron"
  },
  {
    id: 42,
    question: "Viết cấu hình electron giúp ta biết được điều gì?",
    options: [
      "Xác định vị trí trong bảng tuần hoàn và dự đoán tính chất hóa học",
      "Tính được khối lượng tuyệt đối của nguyên tử",
      "Tính được thời gian bán hủy của đồng vị",
      "Xác định chính xác quỹ đạo chuyển động của electron"
    ],
    answer: "Xác định vị trí trong bảng tuần hoàn và dự đoán tính chất hóa học"
  },
  {
    id: 43,
    question: "Thứ tự mức năng lượng của các phân lớp để điền electron là gì?",
    options: [
      "1s → 2s → 2p → 3s → 3p → 4s → 3d → 4p",
      "1s → 2s → 2p → 3s → 3p → 3d → 4s → 4p",
      "1s → 2s → 3s → 4s → 2p → 3p",
      "1s → 2p → 3d → 4f"
    ],
    answer: "1s → 2s → 2p → 3s → 3p → 4s → 3d → 4p"
  },
  {
    id: 44,
    question: "Một orbital nguyên tử (AO) chứa tối đa bao nhiêu electron?",
    options: ["2 electron", "1 electron", "4 electron", "6 electron"],
    answer: "2 electron"
  },
  {
    id: 45,
    question: "Số khối (A) có quyết định bản chất hóa học của nguyên tố không?",
    options: [
      "Không, chỉ số điện tích hạt nhân (Z) mới quyết định",
      "Có, các nguyên tử cùng số khối sẽ có tính chất hóa học giống nhau",
      "Có, nếu số khối lớn hơn 100",
      "Số khối chỉ ảnh hưởng đến màu sắc nguyên tử"
    ],
    answer: "Không, chỉ số điện tích hạt nhân (Z) mới quyết định"
  },
  {
    id: 46,
    question: "Kiến thức về cấu tạo nguyên tử (Chương 1) là nền tảng để học tốt những phần nào?",
    options: [
      "Bảng tuần hoàn các nguyên tố hóa học và Liên kết hóa học",
      "Động học hóa học và tốc độ phản ứng",
      "Cân bằng hóa học",
      "Điện hóa học"
    ],
    answer: "Bảng tuần hoàn các nguyên tố hóa học và Liên kết hóa học"
  }
];
