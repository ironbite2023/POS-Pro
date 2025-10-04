"use client";
import { useState } from "react";
import { CreditCard, Wallet, Receipt, Printer, Clock, Users, CheckCircle, X, Dice6, Square, SquareX, Smartphone, Wifi, WifiOff, User } from "lucide-react";
import { Card, Box, Flex, Text, Button, Heading, Badge, Grid, Dialog } from "@radix-ui/themes";
import OrderTimer from "@/components/common/OrderTimer";
import AuthPINDialog from "@/components/common/AuthPINDialog";
import { useAccentColor } from "@/contexts/AccentColorContext";

interface TableOrder {
  id: string;
  tableNumber: string;
  pax: number;
  maxPax: number;
  timeElapsed: Date;
  status: "unpaid" | "paid" | "available" | "reserved";
  orderItems: OrderItem[];
  totalAmount: number;
  customerName?: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  specifications?: string[];
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export default function CheckoutPage() {
  const [selectedTable, setSelectedTable] = useState<TableOrder | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isOnline] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState("Jane");
  const { accentColor } = useAccentColor();
  
  const paymentMethods: PaymentMethod[] = [
    { id: "card", name: "Credit Card", icon: <CreditCard size={24} /> },
    { id: "cash", name: "Cash", icon: <Wallet size={24} /> },
    { id: "ewallet", name: "E-Wallet", icon: <Smartphone size={24} /> },
  ];

  const tables: TableOrder[] = [
    {
      id: "T1",
      tableNumber: "01",
      pax: 4,
      maxPax: 4,
      timeElapsed: new Date(Date.now() - 35 * 60 * 1000),
      status: "unpaid",
      orderItems: [
        {
          name: "Grill Pork Chop",
          quantity: 1,
          price: 12.99,
          specifications: ["size: large"]
        },
        {
          name: "Orange Juice",
          quantity: 2,
          price: 5.00,
          specifications: ["size: large", "less ice"]
        }
      ],
      totalAmount: 22.99
    },
    {
      id: "T2",
      tableNumber: "02",
      pax: 6,
      maxPax: 8,
      timeElapsed: new Date(Date.now() - 12 * 60 * 1000),
      status: "unpaid",
      orderItems: [
        {
          name: "Hawaiian Pizza",
          quantity: 1,
          price: 15.00,
          specifications: ["size: large", "more onion"]
        },
        {
          name: "Macarons",
          quantity: 1,
          price: 4.99,
          specifications: ["size: 1 set", "flavour: random"]
        }
      ],
      totalAmount: 19.99
    },
    {
      id: "T11",
      tableNumber: "11",
      pax: 0,
      maxPax: 4,
      timeElapsed: new Date(),
      status: "reserved",
      orderItems: [],
      totalAmount: 0,
      customerName: "Sean"
    },
    {
      id: "T3",
      tableNumber: "03",
      pax: 2,
      maxPax: 4,
      timeElapsed: new Date(Date.now() - 45 * 60 * 1000),
      status: "paid",
      orderItems: [
        { name: "Pasta Carbonara", quantity: 1, price: 14.99, specifications: ["extra cheese"] },
        { name: "Iced Tea", quantity: 2, price: 3.99, specifications: ["less ice"] }
      ],
      totalAmount: 22.97
    },
    {
      id: "T4",
      tableNumber: "04",
      pax: 0,
      maxPax: 2,
      timeElapsed: new Date(),
      status: "available",
      orderItems: [],
      totalAmount: 0
    },
    {
      id: "T5",
      tableNumber: "05",
      pax: 3,
      maxPax: 4,
      timeElapsed: new Date(Date.now() - 20 * 60 * 1000),
      status: "unpaid",
      orderItems: [
        { name: "Steak", quantity: 2, price: 29.99, specifications: ["medium rare"] },
        { name: "Wine", quantity: 1, price: 25.00, specifications: ["red wine"] }
      ],
      totalAmount: 84.98
    },
    {
      id: "T6",
      tableNumber: "06",
      pax: 0,
      maxPax: 6,
      timeElapsed: new Date(),
      status: "reserved",
      orderItems: [],
      totalAmount: 0,
      customerName: "John"
    },
    {
      id: "T7",
      tableNumber: "07",
      pax: 4,
      maxPax: 4,
      timeElapsed: new Date(Date.now() - 15 * 60 * 1000),
      status: "unpaid",
      orderItems: [
        { name: "Sushi Set", quantity: 2, price: 45.99 }
      ],
      totalAmount: 91.98
    },
    {
      id: "T8",
      tableNumber: "08",
      pax: 0,
      maxPax: 2,
      timeElapsed: new Date(),
      status: "available",
      orderItems: [],
      totalAmount: 0
    },
    {
      id: "T9",
      tableNumber: "09",
      pax: 2,
      maxPax: 4,
      timeElapsed: new Date(Date.now() - 50 * 60 * 1000),
      status: "paid",
      orderItems: [
        { name: "Salad", quantity: 1, price: 8.99 },
        { name: "Soup", quantity: 1, price: 6.99 }
      ],
      totalAmount: 15.98
    },
    {
      id: "T10",
      tableNumber: "10",
      pax: 0,
      maxPax: 8,
      timeElapsed: new Date(),
      status: "reserved",
      orderItems: [],
      totalAmount: 0,
      customerName: "Mary"
    },
    {
      id: "T12",
      tableNumber: "12",
      pax: 6,
      maxPax: 6,
      timeElapsed: new Date(Date.now() - 25 * 60 * 1000),
      status: "unpaid",
      orderItems: [
        { name: "BBQ Set", quantity: 2, price: 59.99 },
        { name: "Beer", quantity: 6, price: 5.99 }
      ],
      totalAmount: 155.92
    },
    {
      id: "T13",
      tableNumber: "13",
      pax: 0,
      maxPax: 4,
      timeElapsed: new Date(),
      status: "available",
      orderItems: [],
      totalAmount: 0
    },
    {
      id: "T14",
      tableNumber: "14",
      pax: 0,
      maxPax: 4,
      timeElapsed: new Date(),
      status: "available",
      orderItems: [],
      totalAmount: 0
    },
    {
      id: "T15",
      tableNumber: "15",
      pax: 2,
      maxPax: 4,
      timeElapsed: new Date(Date.now() - 10 * 60 * 1000),
      status: "unpaid",
      orderItems: [
        { name: "Pizza", quantity: 1, price: 18.99 }
      ],
      totalAmount: 18.99
    }
  ];

  const printBill = () => {
    // Implement print functionality
    console.log("Printing bill...");
  };

  const completePayment = () => {
    // Here you would typically process the payment
    // For now, we'll just close the checkout dialog and show success
    setSelectedTable(null);
    setShowSuccessDialog(true);
    
    // Reset selected method for next payment
    setSelectedMethod("");

    // Auto close the dialog after 3 seconds
    setTimeout(() => {
      setShowSuccessDialog(false);
    }, 1500);
  };

  const handleAuthSuccess = (username: string) => {
    setCurrentUser(username);
  };

  const handleLogout = () => {
    setCurrentUser("");
  };

  return (
    <Box>
      {/* Top Bar */}
      <Box className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-10">
        <Flex align="center" justify="between" px="4" py="2" direction={{ initial: 'column', lg: 'row' }} gap="3">
          <Flex align="center" gap="2">
            <svg xmlns="http://www.w3.org/2000/svg" width="109" height="16" fill="none">
              <g clipPath="url(#a)">
                <path fill={`var(--${accentColor}-4)`} d="M13.608 1.285c.483 0 .874-.316.874-.71 0-.391-.39-.71-.874-.71s-.875.319-.875.71c0 .394.391.71.875.71Z"/>
                <mask id="b" width="27" height="4" x="0" y="10" maskUnits="userSpaceOnUse" style={{ maskType: 'luminance' }}>
                  <path fill="#fff" d="M0 10.886h26.954v2.313H0v-2.313Z"/>
                </mask>
                <g mask="url(#b)">
                  <path fill={`var(--${accentColor}-4)`} d="M26.148 11.22H1.068a1.068 1.068 0 1 0 0 2.137h25.08a1.068 1.068 0 1 0 0-2.137Z"/>
                </g>
                <path fill={`var(--${accentColor}-9)`} d="M5.473 7.561c.256-1.265 1.05-2.65 2.295-3.184.23-.101.433.242.2.34-1.16.502-1.877 1.77-2.113 2.949-.051.25-.433.146-.382-.105Zm18.716 3.143c.006-.099.009-.197.009-.296 0-4.754-4.741-8.607-10.59-8.607s-10.59 3.853-10.59 8.607c0 .099.003.197.006.296H24.19Z"/>
                <path fill="#3F3F3F" d="M36.64.705h8.23l-.314 1.447h-3.988l-.82 3.677h3.342l-.313 1.428h-3.342l-.9 4.076h3.988L42.23 12.8H34L36.64.705Z"/>
                <path fill="#3F3F3F" d="M44.362 5.314a8.713 8.713 0 0 1 2.033-.685A11.11 11.11 0 0 1 48.74 4.4c.834 0 1.525.063 2.072.19.547.127.984.312 1.31.553.326.241.554.527.684.857.13.33.195.705.195 1.124 0 .241-.02.501-.058.78-.026.28-.059.515-.098.706l-.919 4.19H48.78l-.352-1.219h-.117a4.345 4.345 0 0 1-1.467 1.029 4.232 4.232 0 0 1-1.642.342c-.312 0-.619-.044-.918-.133a2.48 2.48 0 0 1-.802-.4 2.174 2.174 0 0 1-.567-.705c-.143-.292-.215-.641-.215-1.047 0-.66.183-1.181.548-1.562.378-.394.866-.686 1.466-.876a8.276 8.276 0 0 1 2.052-.381c.77-.051 1.538-.077 2.307-.077.026-.127.059-.304.098-.533.039-.241.059-.45.059-.628 0-.229-.066-.439-.196-.63-.117-.202-.371-.304-.762-.304-.456 0-.795.134-1.017.4a1.987 1.987 0 0 0-.41.934H43.99l.372-1.696Zm4.496 3.353h-.352c-.378 0-.704.05-.977.152-.26.089-.476.21-.645.362a1.521 1.521 0 0 0-.47 1.086c0 .304.079.533.235.685a.85.85 0 0 0 .587.229c.273 0 .54-.095.801-.286.274-.19.443-.444.508-.762l.313-1.466ZM53.552 4.61c.483-.102.906-.216 1.271-.343.365-.127.697-.286.997-.477a4.53 4.53 0 0 0 .88-.704c.286-.28.593-.623.919-1.029h2.013l-.567 2.553h1.525l-.254 1.276h-1.544L57.99 9.6c-.065.292-.117.552-.156.781-.04.229-.059.406-.059.533 0 .254.091.413.274.476.195.064.554.096 1.075.096L58.83 12.8a2.316 2.316 0 0 1-.43.057c-.183.013-.391.026-.626.038a6.187 6.187 0 0 1-.704.038c-.234.013-.443.02-.625.02-.326 0-.645-.026-.958-.077a2.485 2.485 0 0 1-.84-.247 1.667 1.667 0 0 1-.607-.59c-.143-.255-.215-.598-.215-1.03 0-.152.007-.342.02-.57a6.73 6.73 0 0 1 .137-.763l.82-3.79H53.28l.273-1.276ZM63.32 12.8H59.33L62.107 0h4.008l-2.796 12.8ZM69.379 4.61l.586 5.6 3.089-5.6h2.072l-4.711 8.19c-.47.8-.945 1.416-1.427 1.848a4.73 4.73 0 0 1-1.584.952 6.146 6.146 0 0 1-1.876.343A41.93 41.93 0 0 1 63.2 16l.293-1.314c.43 0 .828-.007 1.193-.02.378-.012.678-.05.9-.114.299-.076.514-.216.644-.419.13-.19.196-.476.196-.857 0-.254-.026-.546-.078-.876-.04-.33-.085-.68-.137-1.048l-.958-6.742h4.125ZM80.064 7.58c.391 0 .717-.158.978-.475a3.76 3.76 0 0 0 .664-1.162c.183-.457.313-.933.391-1.429a8.45 8.45 0 0 0 .118-1.295c0-.343-.06-.629-.177-.857-.117-.241-.37-.362-.762-.362h-.88l-1.231 5.58h.9ZM78.891 8.8l-.88 4H73.79L76.428.705h4.516c.743 0 1.42.038 2.033.114.612.076 1.14.229 1.583.457.444.229.789.559 1.036.99.248.42.372.985.372 1.696 0 .66-.11 1.289-.333 1.886A3.829 3.829 0 0 1 84.6 7.39c-.469.432-1.081.775-1.837 1.03-.756.253-1.675.38-2.757.38h-1.114Z"/>
                <path fill="#3F3F3F" d="M92.763.514c1.121 0 2.027.14 2.718.42.703.279 1.257.71 1.661 1.295.26.393.463.838.606 1.333.144.495.215 1.067.215 1.714 0 .559-.052 1.118-.156 1.676a9.625 9.625 0 0 1-.45 1.62c-.182.507-.41.99-.684 1.447-.26.444-.554.838-.88 1.181a5.101 5.101 0 0 1-2.13 1.371c-.795.254-1.78.381-2.952.381-1.134 0-2.046-.114-2.737-.342-.691-.229-1.238-.597-1.642-1.105-.287-.356-.515-.807-.684-1.353-.157-.546-.235-1.231-.235-2.057 0-1.41.254-2.666.762-3.771.522-1.118 1.258-2 2.21-2.648A6.234 6.234 0 0 1 90.3.8c.704-.19 1.525-.286 2.463-.286ZM90.554 11.62c.3 0 .58-.127.84-.38.274-.268.522-.617.744-1.049.234-.444.443-.946.625-1.504.196-.559.359-1.137.489-1.734a17.3 17.3 0 0 0 .293-1.771 12.57 12.57 0 0 0 .117-1.62c0-.66-.071-1.11-.215-1.351-.13-.254-.325-.381-.586-.381-.3 0-.587.127-.86.38-.274.254-.535.597-.782 1.03a9.29 9.29 0 0 0-.645 1.466 21.524 21.524 0 0 0-.489 1.695c-.13.584-.234 1.162-.313 1.733a14.02 14.02 0 0 0-.098 1.581c0 .724.079 1.226.235 1.505.17.267.385.4.645.4ZM105.032 4.21c.039-.19.058-.451.058-.781 0-.19-.013-.375-.039-.553a1.726 1.726 0 0 0-.137-.495.704.704 0 0 0-.293-.343.884.884 0 0 0-.508-.133c-.235 0-.45.05-.645.152a1.97 1.97 0 0 0-.528.4 1.828 1.828 0 0 0-.352.553 1.791 1.791 0 0 0-.117.647c0 .33.084.584.254.762.182.178.417.324.704.438.286.114.612.21.977.286.365.076.743.165 1.134.267.326.088.651.203.977.342.326.14.613.33.86.572.261.228.47.533.626.914.156.368.235.832.235 1.39 0 .8-.163 1.474-.489 2.02-.326.546-.776.99-1.349 1.333-.573.343-1.258.59-2.053.743a13.4 13.4 0 0 1-2.561.228c-.938 0-1.707-.057-2.306-.171-.587-.127-1.05-.26-1.388-.4-.404-.165-.704-.356-.9-.572l.665-2.609h3.441c-.013.114-.026.273-.039.476-.013.19-.02.343-.02.457 0 .153.02.311.059.477.039.165.097.317.176.457.091.14.215.254.371.342.156.09.352.134.587.134.26 0 .488-.057.684-.172.208-.114.378-.254.508-.419a1.77 1.77 0 0 0 .313-.571c.078-.216.117-.425.117-.629 0-.279-.072-.514-.215-.704-.13-.19-.313-.35-.547-.477a3.455 3.455 0 0 0-.821-.342c-.3-.102-.613-.204-.939-.305a15.33 15.33 0 0 1-.997-.324 3.42 3.42 0 0 1-.938-.533 2.948 2.948 0 0 1-.723-.857c-.183-.356-.274-.807-.274-1.353 0-.813.209-1.492.626-2.038a4.95 4.95 0 0 1 1.603-1.352 7.365 7.365 0 0 1 2.13-.724 11.28 11.28 0 0 1 2.19-.229c.912 0 1.694.108 2.346.324.664.203 1.166.445 1.505.724l-.723 2.648h-3.245Z"/>
              </g>
              <defs>
                <clipPath id="a">
                  <path fill="#fff" d="M0 0h109v16H0z"/>
                </clipPath>
              </defs>
            </svg>
          </Flex>

          <Flex align="center" gap="6">
            {/* Clock */}
            <Flex align="center" gap="4">
              <Flex align="center" gap="1">
                <Clock size={18} />
                <Text size="3" weight="medium">
                  {new Date().toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </Text>
              </Flex>

              {/* Online offline indicator */}
              <Flex align="center" gap="1">
                {isOnline ? (
                  <Wifi size={18} color="green" />
                ) : (
                  <WifiOff size={18} color="red" />
                )}
                <Text size="3" weight="medium" color={isOnline ? "green" : "red"}>{isOnline ? "Online" : "Offline"}</Text>
              </Flex>

              {/* Switch User */}
              <Flex align="center" gap="2">
                {currentUser && (
                  <Flex align="center" gap="1">
                    <User size={18} />
                    <Text size="2" weight="medium">{currentUser}</Text>
                  </Flex>
                )}
                {currentUser && (
                  <Button 
                    size="2" 
                    variant="outline"
                  onClick={() => setShowAuthDialog(true)}
                >
                  Switch User
                </Button>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Box>

      
      {currentUser ? (
        <Box className="mt-28 xl:mt-20">
          <Flex justify="between" align="center" mb="4" direction={{ initial: 'column', sm: 'row' }} gap="4">
            <Flex justify="between" align="center" gap="2">
            {/* Status Legend */}
            <Flex gap="2">
              <Badge variant="soft" color="green">Available</Badge>
              <Badge variant="soft" color="gray">Reserved</Badge>
              <Badge variant="soft" color="red">Occupied</Badge>
              <Text size="2" color="gray">•</Text>
              <Badge variant="soft" color="green">Paid</Badge>
              <Badge variant="soft" color="red">Unpaid</Badge>
            </Flex>
          </Flex>

          {/* Table Statistics */}
          <Flex gap="6">
              <Flex align="center" gap="2">
                <Square size={18} />
                <Text weight="medium" className="hidden lg:block">Total Tables:</Text>
                <Badge size="2" variant="soft">{tables.length}</Badge>
              </Flex>
              <Flex align="center" gap="2">
                <CheckCircle size={18} color="green" />
                <Text weight="medium" color="green" className="hidden lg:block">Available:</Text>
                <Badge size="2" color="green" variant="soft">
                  {tables.filter(table => table.status === 'available').length}
                </Badge>
              </Flex>
              <Flex align="center" gap="2">
                <Dice6 size={18} color="orange" />
                <Text weight="medium" color="orange" className="hidden lg:block">Occupied:</Text>
                <Badge size="2" color="orange" variant="soft">
                  {tables.filter(table => table.status === 'unpaid').length}
                </Badge>
              </Flex>
              <Flex align="center" gap="2">
                <SquareX size={18} color="gray" />
                <Text weight="medium" color="gray" className="hidden lg:block">Reserved:</Text>
                <Badge size="2" color="gray" variant="soft">
                  {tables.filter(table => table.status === 'reserved').length}
                </Badge>
              </Flex>
              <Flex align="center" gap="2">
                <Receipt size={18} color="red" />
                <Text weight="medium" color="red" className="hidden lg:block">Unpaid:</Text>
                <Badge size="2" color="red" variant="soft">
                  {tables.filter(table => table.status === 'unpaid').length}
                </Badge>
              </Flex>
          </Flex>
        </Flex>

        <Grid columns={{ initial: '1', sm: '2', md: '3', lg: '4' }} gap="6">
          {tables.map((table) => (
            <Card
              key={table.id}
              variant="surface"
              className={`relative ${table.status === 'reserved' ? 'opacity-50' : 'opacity-100'}
                        ${table.status === 'unpaid' ? 'cursor-pointer' : 'pointer-events-none'}
                        `}
              style={{ boxShadow: table.status === 'reserved' ? 'none' : '' }}
              role="button"
              onClick={() => setSelectedTable(table)}
            >
              {/* Table Header */}
              <Flex justify="between" align="start" mb="2">
                <Flex direction="column">
                  <Text weight="bold" size="5">Table {table.tableNumber}</Text>
                  {table.customerName && (
                    <Text size="1" color="gray">Reserved for {table.customerName}</Text>
                  )}
                </Flex>
                <Badge 
                  size="1"
                  color={
                    table.status === 'available' ? 'green' : 
                    table.status === 'reserved' ? 'gray' : 'red'
                  }
                >
                  {table.status === 'available' ? 'Available' :
                    table.status === 'reserved' ? 'Reserved' : 'Occupied'}
                </Badge>
              </Flex>

              {/* Table Info */}
              <Flex direction="column" gap="2">
                <Flex align="center" gap="1">
                  <Users size={14} />
                  <Text size="2">{table.pax}/{table.maxPax} Pax</Text>
                </Flex>

                {table.status !== 'available' && (
                  <Flex align="center" gap="1">
                    {table.status === 'unpaid' && (
                      <OrderTimer 
                        timeReceived={table.timeElapsed}
                        color="gray"
                        isCompleted={true}
                      />
                    )}
                  </Flex>
                )}

                {table.totalAmount > 0 && (
                  <Flex justify="between" align="center">
                    <Text size="2" weight="medium">${table.totalAmount.toFixed(2)}</Text>
                    <Badge 
                      size="1" 
                      color={table.status === 'paid' ? 'green' : 'red'}
                    >
                      {table.status === 'paid' ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </Flex>
                )}
              </Flex>

              {/* Actions */}
              {table.status === 'unpaid' && (
                <Flex gap="2" mt="3">
                  <Button 
                    size="4" 
                    variant="soft"
                    onClick={() => setSelectedTable(table)}
                    className="!flex-1"
                  >
                    Checkout
                  </Button>
                  <Button 
                    size="4" 
                    variant="outline"
                    onClick={printBill}
                  >
                    <Printer size={20} />
                  </Button>
                </Flex>
              )}
            </Card>
          ))}
        </Grid>

        {/* Checkout Dialog */}
        <Dialog.Root open={!!selectedTable} onOpenChange={(open) => !open && setSelectedTable(null)}>
          <Dialog.Content size="3" className="max-w-4xl">
            <Flex justify="between" align="center" mb="4">
              <Dialog.Title mb="0">Checkout - Table {selectedTable?.tableNumber}</Dialog.Title>
              <Dialog.Close>
                <Button variant="ghost" color="gray">
                  <X size={18} />
                </Button>
              </Dialog.Close>
            </Flex>

            <Flex gap="6">
              {/* Order Details */}
              <Box className="flex-[1.5]">
                <Box className="p-4 border-1 border-slate-200 rounded-md">
                  <Heading size="3" mb="3">Order Details</Heading>
                  {selectedTable?.orderItems.map((item, index) => (
                    <Box key={index} py="2">
                      <Flex justify="between" mb="1">
                        <Text weight="medium">{item.name}</Text>
                        <Text>${(item.price * item.quantity).toFixed(2)}</Text>
                      </Flex>
                      <Flex justify="between" mb="1">
                        <Text size="1" color="gray">Quantity: {item.quantity}</Text>
                        <Text size="1" color="gray">${item.price.toFixed(2)} each</Text>
                      </Flex>
                      {item.specifications?.map((spec, i) => (
                        <Text key={i} size="1" color="gray">- {spec}</Text>
                      ))}
                    </Box>
                  ))}

                  {/* Payment Summary */}
                  <Box mt="4">
                    <Flex justify="between" mb="2">
                      <Text size="2">Subtotal</Text>
                      <Text size="2">${selectedTable?.totalAmount.toFixed(2)}</Text>
                    </Flex>
                    <Flex justify="between" mb="2">
                      <Text size="2">Tax (6%)</Text>
                      <Text size="2">${selectedTable ? (selectedTable.totalAmount * 0.06).toFixed(2) : '0.00'}</Text>
                    </Flex>
                    <Flex justify="between" pt="2" className="border-t border-gray-300">
                      <Text size="4" weight="bold">Total</Text>
                      <Text size="4" weight="bold">
                        ${selectedTable ? (selectedTable.totalAmount * 1.06).toFixed(2) : '0.00'}
                      </Text>
                    </Flex>
                  </Box>
                </Box>
              </Box>

              {/* Payment Methods */}
              <Box className="flex-1">
                <Box className="p-4 border-1 border-slate-200 rounded-md">
                  <Heading size="3" mb="3">Payment Method</Heading>
                  <Grid columns="1" gap="2">
                    {paymentMethods.map((method) => (
                      <Button
                        key={method.id}
                        size="3"
                        variant={selectedMethod === method.id ? 'solid' : 'outline'}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <Flex gap="2">
                          {method.icon}
                          <Text>{method.name}</Text>
                        </Flex>
                      </Button>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </Flex>
            {/* Action Buttons */}
            <Flex gap="2" mt="4" justify="end">
              <Button
                size="4"
                variant="outline" 
                onClick={printBill}
                className="flex-1"
              >
                <Printer size={18} />
                Print Bill
              </Button>
              <Button
                size="4"
                disabled={!selectedMethod}
                className="flex-1"
                onClick={completePayment}
              >
                <CheckCircle size={18} />
                Complete Payment
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
        </Box>
      ) : (
        <Flex justify="center" align="center" className="h-[calc(100vh-8rem)]">
          <Box className="mt-28 xl:mt-20" maxWidth="300px">
            <Card size="3">
              <Flex direction="column" align="center" gap="4">
                <Heading size="5">Please login to continue</Heading>
                <Button size="4" onClick={() => setShowAuthDialog(true)}>Login</Button>
              </Flex>
            </Card>
          </Box>
        </Flex>
      )}

      {/* Success Dialog */}
      <Dialog.Root open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <Dialog.Content size="3" className="max-w-4xl">
          <Flex direction="column" align="center" gap="4" p="4">
            <CheckCircle size={60} color="green" className="text-green-500" />
            <Dialog.Title className="text-center">Payment Successful</Dialog.Title>
            <Text align="center">
              The payment has been processed successfully.
            </Text>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <AuthPINDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
    </Box>
  );
} 