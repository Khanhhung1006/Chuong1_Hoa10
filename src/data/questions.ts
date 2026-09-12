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
      "Chỉ có hạt nhân",
      "Lớp vỏ electron và nơtron"
    ],
    answer: "Hạt nhân và lớp vỏ electron",
  },
  {
    id: 2,
    question: "Hạt nhân nguyên tử gồm những hạt nào?",
    options: [
      "Proton và neutron",
      "Proton và electron",
      "Neutron và electron",
      "Chỉ có proton"
    ],
    answer: "Proton và neutron",
  },
  {
    id: 3,
    question: "Proton mang điện tích gì?",
    options: ["+1e", "-1e", "Không mang điện", "+2e"],
    answer: "+1e",
  },
  {
    id: 4,
    question: "Hạt nào trong nguyên tử có khối lượng nhỏ nhất?",
    options: ["Electron", "Proton", "Neutron", "Hạt nhân"],
    answer: "Electron",
  },
  {
    id: 5,
    question: "Hầu hết khối lượng nguyên tử tập trung ở đâu?",
    options: ["Hạt nhân", "Lớp vỏ electron", "Đều khắp nguyên tử", "Khoảng trống giữa các hạt"],
    answer: "Hạt nhân",
  },
  {
    id: 6,
    question: "Trong nguyên tử trung hòa, mối quan hệ giữa số proton và electron là gì?",
    options: [
      "Số proton = số electron",
      "Số proton > số electron",
      "Số proton < số electron",
      "Tổng số bằng số neutron"
    ],
    answer: "Số proton = số electron",
  },
  {
    id: 7,
    question: "Công thức tính số khối (A) là gì?",
    options: ["A = Z + N", "A = Z - N", "A = P + E", "A = N - Z"],
    answer: "A = Z + N",
  },
  {
    id: 8,
    question: "Nguyên tố hóa học là gì?",
    options: [
      "Tập hợp các nguyên tử có cùng số proton",
      "Tập hợp các nguyên tử có cùng số khối",
      "Tập hợp các phân tử cùng loại",
      "Tập hợp các nguyên tử cùng số neutron"
    ],
    answer: "Tập hợp các nguyên tử có cùng số proton",
  },
  {
    id: 9,
    question: "Số hiệu nguyên tử (Z) quyết định điều gì?",
    options: [
      "Bản chất của nguyên tố",
      "Khối lượng nguyên tử",
      "Số lượng neutron",
      "Kích thước nguyên tử"
    ],
    answer: "Bản chất của nguyên tố",
  },
  {
    id: 10,
    question: "Đồng vị là gì?",
    options: [
      "Các nguyên tử cùng số proton (Z) nhưng khác số neutron (N)",
      "Các nguyên tử cùng số khối (A)",
      "Các phân tử có cùng cấu trúc",
      "Các nguyên tử khác Z nhưng cùng N"
    ],
    answer: "Các nguyên tử cùng số proton (Z) nhưng khác số neutron (N)",
  },
  {
    id: 11,
    question: "Đơn vị khối lượng nguyên tử (u) được định nghĩa thế nào?",
    options: [
      "Bằng 1/12 khối lượng nguyên tử carbon-12",
      "Bằng khối lượng 1 nguyên tử hydrogen",
      "Bằng khối lượng 1 hạt proton",
      "Bằng 1/16 khối lượng nguyên tử oxygen"
    ],
    answer: "Bằng 1/12 khối lượng nguyên tử carbon-12",
  },
  {
    id: 12,
    question: "Số lớp electron bằng gì?",
    options: ["Số chu kì", "Số nhóm", "Số proton", "Số hiệu nguyên tử"],
    answer: "Số chu kì",
  },
  {
    id: 13,
    question: "Phân lớp p chứa tối đa bao nhiêu electron?",
    options: ["6 electron", "2 electron", "10 electron", "14 electron"],
    answer: "6 electron",
  },
  {
    id: 14,
    question: "Nguyên lí Pauli phát biểu thế nào?",
    options: [
      "Một AO tối đa 2 electron spin ngược chiều",
      "Điền electron từ mức năng lượng thấp đến cao",
      "Độc thân trước, ghép đôi sau",
      "Electron phải điền đầy phân lớp s trước"
    ],
    answer: "Một AO tối đa 2 electron spin ngược chiều",
  },
  {
    id: 15,
    question: "Quy tắc Hund phát biểu thế nào?",
    options: [
      "Độc thân trước, ghép đôi sau",
      "Một AO chứa tối đa 2 electron",
      "Electron quyết định tính chất hóa học",
      "Điền đầy lớp trong trước"
    ],
    answer: "Độc thân trước, ghép đôi sau",
  }
];
