"use client";
import { useState } from "react";
import { Clock, CheckCircle, ReceiptText, CookingPot, WifiOff, Wifi } from "lucide-react";
import { Card, Box, Flex, Text, Button, Grid, Badge, Heading } from "@radix-ui/themes";
import OrderTimer from "@/components/common/OrderTimer";
import { useAccentColor } from "@/contexts/AccentColorContext";

interface OrderItem {
  name: string;
  quantity: number;
  specifications?: string[];
  completed?: boolean;
}

interface Order {
  id: string;
  tableNumber: string;
  type: "Dine-in" | "Take Away";
  items: OrderItem[];
  timeReceived: Date;
  status: "in-progress" | "completed";
  completedCount: number;
}

export default function KitchenPage() {
  const { accentColor } = useAccentColor()
  const [isOnline] = useState(false);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "9049",
      tableNumber: "05",
      type: "Dine-in",
      timeReceived: new Date(Date.now() - 7 * 60 * 1000),
      status: "in-progress",
      completedCount: 1,
      items: [
        {
          name: "Pork Burger",
          quantity: 1,
          specifications: ["large size", "extra cheese"],
          completed: false,
        },
        {
          name: "Macarons",
          quantity: 2,
          specifications: ["serve after dishes"],
          completed: false,
        },
        {
          name: "Coke",
          quantity: 2,
          specifications: ["large size", "less ice"],
          completed: true,
        }
      ]
    },
    {
      id: "9047",
      tableNumber: "14",
      type: "Dine-in",
      timeReceived: new Date(Date.now() - 12 * 60 * 1000),
      status: "in-progress",
      completedCount: 3,
      items: [
        {
          name: "Baked chicken wing",
          quantity: 1,
          specifications: ["6 pieces", "honey source"],
          completed: true,
        },
        {
          name: "Veggie Spaghetti",
          quantity: 1,
          specifications: ["size: large", "spicy level: light"],
          completed: true,
        },
        {
          name: "Creamy Coffee",
          quantity: 1,
          specifications: ["no sugar", "more cream"],
          completed: true,
        },
        {
          name: "Grill Chicken Chop",
          quantity: 1,
          specifications: ["ala carte"],
          completed: false,
        }
      ]
    },
    {
      id: "9048",
      tableNumber: "15",
      type: "Take Away",
      timeReceived: new Date(Date.now() - 15 * 60 * 1000),
      status: "in-progress",
      completedCount: 0,
      items: [
        {
          name: "Pork Burger",
          quantity: 1,
          specifications: ["large size", "extra cheese"],
          completed: false,
        },
        {
          name: "Macarons",
          quantity: 1,
          specifications: ["serve after dishes"],
          completed: false,
        }
      ]
    },
    {
      id: "9046",
      tableNumber: "16",
      type: "Take Away",
      timeReceived: new Date(Date.now() - 10 * 60 * 1000),
      status: "completed",
      completedCount: 2,
      items: [
        {
          name: "Pork Burger",
          quantity: 1,
          specifications: ["large size", "extra cheese"], 
          completed: true,
        },
        {
          name: "Macarons",
          quantity: 2,
          specifications: ["serve after dishes"],
          completed: true,
        }
      ]
    }
    
  ]);
  
  const completeItem = (orderId: string, itemName: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(item => {
          if (item.name === itemName) {
            return { ...item, completed: true };
          }
          return item;
        });
        const completedCount = updatedItems.filter(item => item.completed).length;
        const status = completedCount === order.items.length ? "completed" : "in-progress";
        
        return {
          ...order,
          items: updatedItems,
          completedCount,
          status
        };
      }
      return order;
    }));
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

          <Flex align="center" gap="4">
            {/* Clock */}
            <Flex align="center" gap="2">
              <Clock size={18} />
              <Text size="3">
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
          </Flex>
        </Flex>
      </Box>

      {/* Main Content */}
      <Box className="mt-28 xl:mt-20">
        {/* Order Statistics */}
        <Flex gap="6" justify={{ initial: 'center', lg: 'end' }}>
          <Flex align="center" gap="2">
            <ReceiptText size={18} />
            <Text weight="medium" className="hidden lg:block">Total:</Text>
            <Badge size="2" variant="soft">{orders.length}</Badge>
          </Flex>
          <Flex align="center" gap="2">
            <CheckCircle size={18} color="green" />
            <Text weight="medium" color="green" className="hidden lg:block">Completed:</Text>
            <Badge size="2" color="green" variant="soft">
              {orders.filter(order => order.status === 'completed').length}
            </Badge>
          </Flex>
          <Flex align="center" gap="2">
            <CookingPot size={18} color="orange" />
            <Text weight="medium" color="orange" className="hidden lg:block">In Progress:</Text>
            <Badge size="2" color="orange" variant="soft">
              {orders.filter(order => order.status === 'in-progress').length}
            </Badge>
          </Flex>
        </Flex>

        <Box mt="3">
          <Grid columns={{ initial: '1', sm: '2', lg: '3', xl: '4' }} gap="6">
            {orders.map((order) => (
              <Card
                key={order.id}
                size="3"
              >
                {/* Order Header */}
                <Flex justify="between" align="center" mb="4">
                  <Flex direction="column" gap="1">
                    <Heading size="6" weight="bold">Table {order.tableNumber}</Heading>
                    <Flex gap="2" align="center">
                      <Badge size="3" color="brown">Order #{order.id}</Badge>
                      <Badge size="3" variant="soft" color="gray">{order.type}</Badge>
                    </Flex>
                  </Flex>
                  <Flex direction="column" align="end" gap="1">
                    <OrderTimer 
                      timeReceived={order.timeReceived}
                      isCompleted={order.status === 'completed'}
                      color="gray"
                    />
                    <Text size="3" color="gray">
                      Completed: ({order.completedCount}/{order.items.length})
                    </Text>
                  </Flex>
                </Flex>

                {/* Order Items Grid */}
                <Grid gap="3">
                  {order.items.map((item, index) => (
                    <Box
                      key={index}
                      className="p-3 border-1 border-slate-200 rounded-md"
                      style={{ backgroundColor: item.completed ? "white" : "var(--slate-2)" }}
                    >
                      <Flex gap="3">
                        <Box flexGrow="1">
                          <Flex justify="between" align="center" mb="2" gap="2" direction={{ initial: 'column', lg: 'row' }}>
                            <Heading weight="bold" size="4">x{item.quantity} {item.name}</Heading>
                            <Box>
                              {!item.completed ? (
                              <Flex gap="2" justify="between" direction={{ initial: 'column', lg: 'row' }}>
                                <Button
                                  variant="soft" 
                                  onClick={() => completeItem(order.id, item.name)}
                                >
                                  <CheckCircle size={16} />
                                  Mark Complete
                                </Button>
                              </Flex>
                              ) : (
                                <Flex gap="1" align="center" className="text-green-600">
                                  <CheckCircle size={16} /> Completed
                                </Flex>
                              )}
                            </Box>
                          </Flex>
                          {item.specifications && (
                            <Box>
                              {item.specifications.map((spec, i) => (
                                <Text as="p" key={i} size="4" color="gray">- {spec}</Text>
                              ))}
                            </Box>
                          )}
                        </Box>
                      </Flex>
                    </Box>
                  ))}
                </Grid>

                {order.status === 'completed' && (
                  <Badge size="3" color="green" className="flex align-center gap-1" mt="4">
                    <CheckCircle size={16} /> All dishes served • <OrderTimer timeReceived={order.timeReceived} isCompleted={true} /> total time
                  </Badge>
                )}
              </Card>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
} 