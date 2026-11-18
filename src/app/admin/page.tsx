import AdminDashboard from './admin-dashboard';
export const metadata={title:'Admin Control Center | SellPostly',robots:{index:false,follow:false}};
export default function AdminPage(){return <><style>{"body > header, body > footer { display: none; }"}</style><AdminDashboard/></>;}

