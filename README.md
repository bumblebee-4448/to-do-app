# Đặc Tả Yêu Cầu Và Thiết Kế Hệ Thống: Ứng Dụng Quản Lý Công Việc (Todo List)

Tài liệu này mô tả chi tiết yêu cầu bài toán, kiến trúc hệ thống, thiết kế API, cấu trúc thư mục, kế hoạch triển khai và kiểm thử cho ứng dụng **Quản lý công việc (Todo List)** sử dụng **ReactJS** (Frontend) và **NodeJS + ExpressJS** (Backend).

---

## 1. Tổng Quan Dự Án
Ứng dụng **Todo List** cho phép người dùng quản lý các công việc hàng ngày một cách hiệu quả thông qua giao diện trực quan, mượt mà và tương thích tốt trên nhiều thiết bị (Responsive). Hệ thống hỗ trợ đầy đủ các thao tác CRUD cơ bản, tìm kiếm, lọc, phân trang, kiểm tra tính hợp lệ của dữ liệu (Validation) và kiểm thử (Unit Test).

---

## 2. Kiến Trúc Hệ Thống & Công Nghệ Sử Dụng

Hệ thống được thiết kế theo kiến trúc Client - Server tách biệt với các công nghệ và triết lý phát triển sau:

### Frontend (Client)
*   **Framework:** ReactJS.
*   **Routing:** React Router (quản lý điều hướng trang).
*   **Global State & Theme:** Zustand (quản lý app state, UI state toàn cục; xử lý lưu trữ và đồng bộ hóa trạng thái Dark/Light Mode với middleware `persist`).
*   **HTTP Client:** Axios (kết nối Backend API, cấu hình interceptors, timeout).
*   **Server State & Caching:** React Query (`@tanstack/react-query` giúp quản lý cache, đồng bộ trạng thái server, tự động fetch lại khi cần).
*   **Form & Validation:** React Hook Form kết hợp với Zod Schema (tối ưu hiệu năng form, validate kiểu dữ liệu mạnh mẽ).
*   **Styling & UI Library:** TailwindCSS (xây dựng giao diện nhanh, linh hoạt) kết hợp với **shadcn/ui** (bộ thư viện component chất lượng cao, dễ tùy biến xây dựng trên Tailwind và Radix Primitives).
*   **Unit Test:** Vitest + React Testing Library.

#### Các triết lý phát triển Frontend:
*   **Feature-based Architecture:** Tổ chức mã nguồn theo tính năng/domain nghiệp vụ thay vì gom nhóm theo loại file (ví dụ: folder `todos` chứa cả UI, API, Hooks, Types của riêng tính năng đó).
*   **Tách biệt logic fetch data:** Toàn bộ logic gọi API và xử lý dữ liệu từ Server được đưa vào React Query Custom Hooks, giữ cho các UI Component "sạch", chỉ làm nhiệm vụ hiển thị và tương tác.
*   **API Abstraction Layer:** Các API endpoints và các hàm Axios request được tách thành lớp dịch vụ riêng để dễ dàng bảo trì và thay đổi cấu hình.
*   **Optimistic Updates (Cập nhật giao diện trước):** Khi người dùng thực hiện thao tác (như đánh dấu hoàn thành hoặc xóa Todo), giao diện sẽ cập nhật trạng thái mới lập tức. Nếu API gọi thất bại sau đó, hệ thống sẽ tự động rollback (quay lại trạng thái cũ) để đảm bảo trải nghiệm tức thời và chính xác.
*   **Lazy List (Infinite Query):** Hỗ trợ hiển thị danh sách lớn bằng cách tải từng phần (Infinite Scroll hoặc Infinite Pagination) sử dụng `useInfiniteQuery` của React Query để tránh quá tải trình duyệt.

### Backend (Server)
*   **Runtime Environment:** NodeJS.
*   **Framework:** ExpressJS.
*   **Database:** MongoDB kết hợp Mongoose ORM để quản lý và truy vấn dữ liệu.
*   **Validate:** `express-validator` (middleware mạnh mẽ để lọc và validate request body/params).
*   **Unit Test:** Jest + Supertest để kiểm thử API endpoints.

---

## 3. Các Tính Năng Chính (Functional Requirements)

*   **Hiển thị danh sách công việc** (Hỗ trợ phân trang/tải từng phần và sắp xếp).
*   **Thêm công việc mới**.
*   **Chỉnh sửa công việc**.
*   **Xóa công việc**.
*   **Đánh dấu hoàn thành / chưa hoàn thành**.
*   **Tìm kiếm hoặc lọc** (Theo trạng thái và từ khóa).

---

## 4. Thiết Kế API Chuẩn REST (RESTful API Specification)

Hệ thống tuân thủ nghiêm ngặt các nguyên tắc thiết kế **RESTful API** (sử dụng danh từ số nhiều, đúng HTTP Methods và trả về đúng HTTP Status Codes).

### Cấu trúc Response JSON chuẩn hóa

*   **Khi thành công (Success Response):**
    ```json
    {
      "success": true,
      "data": { ... } // hoặc [...] đối với danh sách
      // "pagination": { ... } (nếu là API GET danh sách có phân trang)
    }
    ```
*   **Khi thất bại (Error Response):**
    ```json
    {
      "success": false,
      "message": "Thông điệp lỗi chi tiết",
      "errors": [] // Danh sách lỗi chi tiết (nếu có lỗi validation)
    }
    ```

---

### Danh sách API Endpoints

#### 1. Lấy danh sách công việc (GET `/api/v1/todos`)
*   **Mô tả:** Lấy danh sách công việc có hỗ trợ tìm kiếm, lọc, phân trang và sắp xếp.
*   **HTTP Method:** `GET`
*   **Query Parameters:**
    *   `page`: Trang hiện tại (mặc định: `1`)
    *   `limit`: Số lượng item trên mỗi trang (mặc định: `10`)
    *   `search`: Từ khóa tìm kiếm theo tiêu đề hoặc mô tả (tùy chọn)
    *   `status`: Lọc theo trạng thái `pending` hoặc `completed` (tùy chọn)
    *   `sortBy`: Sắp xếp theo trường mong muốn, ví dụ `createdAt` hoặc `priority` (mặc định: `createdAt`)
    *   `order`: Hướng sắp xếp `asc` hoặc `desc` (mặc định: `desc`)
*   **HTTP Status Codes:**
    *   `200 OK`: Thành công.
    *   `500 Internal Server Error`: Lỗi hệ thống.

#### 2. Lấy chi tiết một công việc (GET `/api/v1/todos/:id`)
*   **Mô tả:** Lấy thông tin chi tiết của một Todo cụ thể bằng ID.
*   **HTTP Method:** `GET`
*   **HTTP Status Codes:**
    *   `200 OK`: Thành công.
    *   `404 Not Found`: Không tìm thấy Todo với ID được cung cấp.
    *   `500 Internal Server Error`: Lỗi hệ thống.

#### 3. Tạo mới một công việc (POST `/api/v1/todos`)
*   **Mô tả:** Thêm mới một Todo vào hệ thống.
*   **HTTP Method:** `POST`
*   **Request Body:**
    ```json
    {
      "title": "Học ReactJS nâng cao", // Bắt buộc
      "description": "Tìm hiểu chi tiết về Custom Hooks và Context API", // Tùy chọn
      "priority": "medium", // Tùy chọn (low / medium / high, mặc định: low)
      "dueDate": "2026-07-10T12:00:00.000Z" // Tùy chọn (định dạng ISO 8601)
    }
    ```
*   **HTTP Status Codes:**
    *   `201 Created`: Tạo thành công.
    *   `400 Bad Request`: Lỗi validation (ví dụ: thiếu title hoặc title không hợp lệ).
    *   `500 Internal Server Error`: Lỗi hệ thống.

#### 4. Cập nhật toàn bộ một công việc (PUT `/api/v1/todos/:id`)
*   **Mô tả:** Thay thế/Cập nhật toàn bộ thông tin của một Todo hiện có.
*   **HTTP Method:** `PUT`
*   **Request Body:** Gửi đầy đủ các trường thông tin cần cập nhật (như khi tạo mới).
*   **HTTP Status Codes:**
    *   `200 OK`: Cập nhật thành công.
    *   `400 Bad Request`: Dữ liệu đầu vào không hợp lệ.
    *   `404 Not Found`: Không tìm thấy Todo.
    *   `500 Internal Server Error`: Lỗi hệ thống.

#### 5. Cập nhật một phần công việc (PATCH `/api/v1/todos/:id`)
*   **Mô tả:** Cập nhật một hoặc một vài trường của Todo (ví dụ: chỉ cập nhật trạng thái `status` hoặc độ ưu tiên `priority`). Phục vụ đắc lực cho tính năng **Optimistic Updates**.
*   **HTTP Method:** `PATCH`
*   **Request Body:** Chỉ truyền các trường cần thay đổi. Ví dụ để cập nhật trạng thái:
    ```json
    {
      "status": "completed"
    }
    ```
*   **HTTP Status Codes:**
    *   `200 OK`: Cập nhật thành công.
    *   `400 Bad Request`: Dữ liệu cập nhật không hợp lệ.
    *   `404 Not Found`: Không tìm thấy Todo.
    *   `500 Internal Server Error`: Lỗi hệ thống.

#### 6. Xóa một công việc (DELETE `/api/v1/todos/:id`)
*   **Mô tả:** Xóa hoàn toàn một Todo ra khỏi hệ thống.
*   **HTTP Method:** `DELETE`
*   **HTTP Status Codes:**
    *   `204 No Content`: Xóa thành công, không trả về dữ liệu trong body.
    *   `404 Not Found`: Không tìm thấy Todo.
    *   `500 Internal Server Error`: Lỗi hệ thống.

---

## 5. Cấu Trúc Thư Mục Dự Kiến (Project Structure)

Dự án được tổ chức theo cấu trúc Monorepo chia làm `client` (Feature-based) và `server` (Clean Architecture/MVC):

```text
to-do-list/
├── client/                 # ReactJS Frontend (Feature-based)
│   ├── public/
│   ├── src/
│   │   ├── components/     # UI Components dùng chung (Button, Input, Spinner, Modal)
│   │   ├── config/         # Cấu hình chung cho ứng dụng (axios, queryClient, constants)
│   │   ├── features/       # Quản lý theo domain nghiệp vụ (Features)
│   │   │   └── todos/      # Domain Todos
│   │   │       ├── api/    # Chứa các hàm gọi API (getTodos, updateTodo, deleteTodo...)
│   │   │       ├── components/ # Các UI components nội bộ của riêng feature Todos
│   │   │       ├── hooks/  # Custom hooks kết nối React Query (useTodosQuery, useTodoMutation)
│   │   │       ├── stores/ # Zustand store phục vụ riêng cho UI state của feature Todos
│   │   │       └── index.js # Entry point tùy chọn xuất bản các components/hooks cần dùng ngoài feature
│   │   ├── hooks/          # Custom hooks dùng chung toàn cục (useDebounce, useLocalStorage...)
│   │   ├── routes/         # Cấu hình Router (React Router)
│   │   ├── stores/         # Zustand stores dùng chung toàn app (themeStore, authStore...)
│   │   ├── styles/         # CSS design system (global styles, theme variables)
│   │   ├── utils/          # Helper functions (date formatters, formatters...)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── src/__tests__/      # Frontend Unit Tests (Vitest & React Testing Library)
│   ├── package.json
│   └── README.md
│
├── server/                 # NodeJS + ExpressJS Backend
│   ├── src/
│   │   ├── config/         # Cấu hình Database MongoDB, biến môi trường (dotenv)
│   │   ├── controllers/    # Xử lý logic cho các API endpoints
│   │   ├── middlewares/    # Custom middlewares (auth, validation check, error handler)
│   │   ├── models/         # Mongoose schema (Todo Model)
│   │   ├── routes/         # Định nghĩa các Route API
│   │   ├── validations/    # Quy tắc validate request body bằng express-validator
│   │   └── app.js          # Khởi tạo Express app
│   ├── src/__tests__/      # Backend Unit Tests (Jest & Supertest)
│   ├── package.json
│   └── server.js           # Điểm khởi chạy server
│
└── README.md               # Hướng dẫn chạy toàn bộ dự án
```

---

## 6. Xử Lý Validate Dữ Liệu (Validation & Error Handling)

Dữ liệu được kiểm chứng nghiêm ngặt tại cả Client-side và Server-side để bảo vệ tính nhất quán hệ thống:

### Client-side Validation (React Hook Form + Zod)
*   Sử dụng **Zod Schema** định nghĩa các trường dữ liệu:
    *   `title`: kiểu string, bắt buộc nhập (non-empty), độ dài tối thiểu 3 ký tự, tối đa 100 ký tự.
    *   `description`: kiểu string, tùy chọn, tối đa 500 ký tự.
    *   `dueDate`: kiểu date, tùy chọn, nếu nhập phải lớn hơn hoặc bằng thời gian hiện tại.
    *   `priority`: enum (`low`, `medium`, `high`).
*   **React Hook Form** tích hợp với Zod resolver giúp kiểm soát các sự kiện thay đổi của form, không gây re-render thừa và hiển thị thông điệp lỗi tức thì khi dữ liệu không khớp schema.

### Server-side Validation (Express-validator)
*   Sử dụng middleware `express-validator` để chặn dữ liệu không hợp lệ trước khi vào controller:
    *   Validate trường `title`: `.notEmpty()`, `.isLength({ min: 3, max: 100 })`, `.trim()`.
    *   Validate trường `priority`: `.optional().isIn(['low', 'medium', 'high'])`.
    *   Validate trường `dueDate`: `.optional().isISO8601().toDate()`.
*   Nếu phát hiện lỗi validation, server ngay lập tức phản hồi mã **`400 Bad Request`** kèm danh sách lỗi định dạng JSON.
*   **Error-handling Middleware:** Tự động bắt tất cả các Exception phát sinh trong quá trình xử lý database và logic để trả về JSON dạng `{ error: "Thông báo lỗi" }` kèm HTTP status code thích hợp (404, 500).

---

## 7. Thiết Kế Giao Diện & Trải Nghiệm Người Dùng (UX/UI)

Giao diện ứng dụng tuân thủ nghiêm ngặt triết lý **Premium Utilitarian Minimalism & Editorial UI** (lấy cảm hứng từ các ứng dụng workspace cao cấp). Dự án sử dụng **TailwindCSS** kết hợp với hệ thống component **shadcn/ui** để triển khai giao diện.

### Quy tắc màu sắc (Tuyệt đối KHÔNG sử dụng màu Gradient)

#### Giao diện sáng (Light Mode)
*   **Canvas / Nền chủ đạo:** Màu xương ấm (Off-white) `#F7F6F3` hoặc `#FBFBFA`.
*   **Thẻ Todo & Bề mặt (Cards / Surface):** Nền trắng `#FFFFFF` phẳng, viền siêu mỏng `1px solid #EAEAEA` (không dùng bóng đổ nặng).
*   **Màu văn bản:** Chì đen `#111111` hoặc `#2F3437`. Văn bản phụ dùng màu xám nhạt `#787774`.

#### Giao diện tối (Dark Mode)
*   **Canvas / Nền chủ đạo:** Màu xám tối trầm `#18181b` (Tailwind Zinc-900).
*   **Thẻ Todo & Bề mặt (Cards / Surface):** Nền tối phẳng `#27272a` (Zinc-800), viền siêu mỏng `1px solid #3f3f46` (Zinc-700).
*   **Màu văn bản:** Màu xám sáng `#f4f4f5` (Zinc-100). Văn bản phụ dùng màu xám trung tính `#a1a1aa` (Zinc-400).

#### Màu nhấn (Accent Colors - Muted Pastels)
Chỉ sử dụng dải màu phấn siêu nhạt (cực kỳ hạn chế) để phân loại thông tin, không làm mất đi tính đơn sắc tối giản:
*   *Độ ưu tiên High / Quá hạn:* Nền đỏ nhạt (Light: `#FDEBEC` / Dark: `rgba(159,47,45,0.15)`); Chữ đỏ `#9F2F2D`.
*   *Độ ưu tiên Medium:* Nền xanh dương nhạt (Light: `#E1F3FE` / Dark: `rgba(31,108,159,0.15)`); Chữ xanh `#1F6C9F`.
*   *Độ ưu tiên Low / Hoàn thành:* Nền xanh lá nhạt (Light: `#EDF3EC` / Dark: `rgba(52,101,56,0.15)`); Chữ xanh lá `#346538`.

---

### Cơ chế Dark Mode và Quản lý qua Zustand Store
Dark Mode được quản lý tập trung và lưu trữ tự động thông qua Zustand Store kết hợp middleware `persist`:

1.  **Cấu trúc Zustand Store (`themeStore`):**
    ```javascript
    import { create } from 'zustand';
    import { persist } from 'zustand/middleware';

    export const useThemeStore = create(
      persist(
        (set) => ({
          theme: 'light', // Mặc định là 'light'
          toggleTheme: () => set((state) => ({ 
            theme: state.theme === 'light' ? 'dark' : 'light' 
          })),
        }),
        {
          name: 'app-theme-storage', // Khóa lưu trữ trong localStorage
        }
      )
    );
    ```
2.  **Cơ chế áp dụng theme:**
    *   Trạng thái theme (`light`/`dark`) được đồng bộ bằng cách thêm/xóa class `.dark` trên thẻ `<html>` hoặc `<body>` của tài liệu khi ứng dụng React khởi chạy hoặc khi người dùng kích hoạt chuyển đổi qua nút bấm.
    *   Tất cả các style của components (shadcn/ui & Tailwind) sử dụng tiền tố `dark:` để tự động ánh xạ sang hệ màu tối khi class `.dark` được kích hoạt.

---

### Cấu trúc Typography (Phân tầng chữ phong cách tòa soạn)
*   **Văn bản UI, Nút & Form:** Sử dụng các font sans-serif hình học hệ thống có cá tính như: `SF Pro Display`, `Geist Sans`, hoặc `Helvetica Neue`.
*   **Tiêu đề lớn:** Dùng font serif cổ điển như `Lyon Text` hoặc `Instrument Serif`, áp dụng khoảng cách chữ hẹp (`letter-spacing: -0.02em`) để tạo cảm giác sang trọng.
*   **Metadata & Nhãn:** Dùng font chữ đơn trị (Monospace) như `Geist Mono` hoặc `SF Mono` để hiển thị ngày tháng, ID hoặc các thông số kỹ thuật.

### Chuyển động và Vi tương tác (Micro-animations)
*   **Tải danh sách lớn (Lazy List):** Sử dụng hiệu ứng mượt mà khi cuộn hoặc tải thêm phần tử mới: dịch chuyển nhẹ (`translateY(12px)` kết hợp `opacity` chuyển dần từ `0` sang `1` trong `600ms` với đường cong `cubic-bezier(0.16, 1, 0.3, 1)`).
*   **Tương tác nút bấm:** Khi người dùng click (active state), nút bấm co nhẹ lại (`transform: scale(0.98)`).
*   **Đánh dấu hoàn thành:** Hiệu ứng làm mờ nhẹ chữ (`opacity: 0.5`), tạo đường gạch ngang qua tiêu đề và chuyển nền thẻ Todo sang màu xám nhạt siêu phẳng.

### Tính tương thích (Responsive)
*   Sử dụng các class Grid (`grid-cols-1 md:grid-cols-2`) và Flexbox của Tailwind để tự động co giãn giao diện từ Mobile đến Desktop mà không cần cấu hình CSS media queries thủ công.

---

## 8. Kế Hoạch Viết Unit Test

Nhằm đảm bảo dự án chạy ổn định và dễ mở rộng, toàn bộ các tính năng cốt lõi sẽ được bao phủ bởi các Unit Test:

### Backend Tests (Jest + Supertest)
1.  **Test Get Todos:**
    *   Lấy danh sách thành công, kiểm tra cấu trúc dữ liệu trả về và meta phân trang.
    *   Kiểm tra tính năng tìm kiếm (search query) và lọc theo trạng thái.
2.  **Test Create Todo:**
    *   Thêm mới thành công khi truyền đủ data hợp lệ.
    *   Trả về lỗi `400 Bad Request` khi tiêu đề trống hoặc quá ngắn.
3.  **Test Update Todo:**
    *   Cập nhật thành công thông tin todo.
    *   Trả về lỗi `400` hoặc `404` khi truyền ID không tồn tại hoặc dữ liệu cập nhật không hợp lệ.
4.  **Test Delete Todo:**
    *   Xóa thành công và không còn tìm thấy todo đó trong DB nữa.

### Frontend Tests (Vitest + React Testing Library)
1.  **Render App:** Đảm bảo trang chính và danh sách công việc hiển thị đúng.
2.  **Add Todo Flow:** Mô phỏng người dùng nhập dữ liệu vào Form, nhấn nút Add và kiểm tra xem item mới có xuất hiện trong DOM hay không.
3.  **Validate Form Error:** Nhập tiêu đề quá ngắn hoặc để trống, nhấn submit và kiểm tra xem thông báo lỗi validate có xuất hiện hay không.
4.  **Toggle Todo Flow:** Click vào checkbox/nút hoàn thành công việc và kiểm tra style/trạng thái của phần tử đó thay đổi.
5.  **Filter/Search Flow:** Gõ từ khóa tìm kiếm và kiểm tra danh sách có hiển thị đúng các item tương ứng không.

---

## 9. Hướng Dẫn Chạy Trực Tiếp Trên Máy Local (Không Dùng Docker)

Để khởi chạy dự án Todo List trực tiếp trên môi trường máy tính cá nhân của bạn, hãy làm theo các bước hướng dẫn chi tiết dưới đây:

### Bước 1: Chuẩn bị môi trường
*   Cài đặt **Node.js** phiên bản LTS mới nhất (Khuyên dùng từ `v18.x` trở lên).
*   Cài đặt và chạy **MongoDB** trên máy local (mặc định tại `mongodb://localhost:27017`) hoặc đăng ký một tài khoản cơ sở dữ liệu đám mây **MongoDB Atlas** để lấy chuỗi kết nối.

---

### Bước 2: Thiết lập cấu hình và khởi chạy Backend (Server)

1.  Di chuyển vào thư mục `server`:
    ```bash
    cd server
    ```
2.  Cài đặt các gói thư viện phụ thuộc:
    ```bash
    npm install
    ```
3.  Tạo file cấu hình môi trường `.env` tại thư mục `/server` với nội dung mẫu sau:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/todo-db
    NODE_ENV=development
    ```
    *(Thay đổi giá trị `MONGO_URI` nếu bạn sử dụng cơ sở dữ liệu MongoDB Atlas trên đám mây).*
4.  Khởi chạy Backend Server ở chế độ nhà phát triển (tự động tải lại code khi sửa đổi bằng `nodemon`):
    ```bash
    npm run dev
    ```
    *Mặc định, server sẽ lắng nghe tại địa chỉ: `http://localhost:5000`*

---

### Bước 3: Thiết lập cấu hình và khởi chạy Frontend (Client)

1.  Mở một tab terminal mới và di chuyển vào thư mục `client`:
    ```bash
    cd client
    ```
2.  Cài đặt các gói thư viện phụ thuộc:
    ```bash
    npm install
    ```
3.  Tạo file cấu hình môi trường `.env` tại thư mục `/client` để khai báo địa chỉ API Backend:
    ```env
    VITE_API_URL=http://localhost:5000/api/v1
    ```
4.  Khởi chạy Frontend Client:
    ```bash
    npm run dev
    ```
    *Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:3000`*

---

### Bước 4: Chạy kiểm thử tự động (Unit Test)

Bạn có thể chạy các bộ test kiểm tra toàn bộ tính năng và logic của cả Frontend và Backend:

*   **Chạy Unit Test cho Backend (Express API):**
    ```bash
    cd server
    npm test
    ```
*   **Chạy Unit Test cho Frontend (ReactJS):**
    ```bash
    cd client
    npm test
    ```
