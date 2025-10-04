"use client";

import React, { useState } from "react";
import { Plus, Minus, Trash2, X, ChefHatIcon, ForkKnife, Sandwich, Cake, Coffee, Send, ArrowLeft, CreditCard, Wallet, ArrowRight } from "lucide-react";
import { Card, Box, Flex, Text, Button, IconButton, Heading, Grid, Dialog, Inset, ScrollArea, RadioCards, TextArea, TextField } from "@radix-ui/themes";
import Image from "next/image";
import { useAccentColor } from "@/contexts/AccentColorContext";

// Enhanced interfaces
interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  sizes?: {
    name: string;
    price: number;
  }[];
  addons?: {
    id: number;
    name: string;
    price: number;
  }[];
}

interface OrderItem {
  id: number;
  name: string;
  basePrice: number;
  quantity: number;
  size?: string;
  addons?: {
    id: number;
    name: string;
    price: number;
  }[];
  notes?: string;
  totalPrice: number;
}

type OrderStep = "menu" | "summary" | "payment" | "success";

// Header component with back button and logo
const Header = ({ 
  currentStep, 
  goBack,
  accentColor
}: { 
  currentStep: OrderStep, 
  goBack: () => void,
  accentColor: any
}) => (
  <Box style={{ 
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'white',
    borderBottom: '1px solid var(--gray-5)',
    padding: '8px',
    margin: '0 auto',
    width: '100%'
  }}>
    <Flex justify="between" align="center">
      {currentStep !== "menu" ? (
        <IconButton variant="ghost" onClick={goBack}>
          <ArrowLeft size={20} />
        </IconButton>
      ) : (
        <Box width="32px" /> // Empty spacer to maintain layout
      )}
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
      <Box width="32px" /> {/* Empty spacer to maintain layout */}
    </Flex>
  </Box>
);

// Step indicator component
const StepIndicator = ({ currentStep }: { currentStep: OrderStep }) => (
  <Flex justify="between" align="center" width="100%" mb="4">
    <Flex gap="2" align="center">
      <Box
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: currentStep === "menu" ? 'var(--accent-9)' : 'var(--gray-5)',
          color: currentStep === "menu" ? 'white' : 'var(--gray-11)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
        }}
      >
        1
      </Box>
      <Text size="2" weight={currentStep === "menu" ? "bold" : "regular"}>Menu</Text>
    </Flex>
    
    <Box style={{ height: '2px', backgroundColor: 'var(--gray-5)', flex: 1, margin: '0 8px' }} />
    
    <Flex gap="2" align="center">
      <Box
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: currentStep === "summary" ? 'var(--accent-9)' : 'var(--gray-5)',
          color: currentStep === "summary" ? 'white' : 'var(--gray-11)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
        }}
      >
        2
      </Box>
      <Text size="2" weight={currentStep === "summary" ? "bold" : "regular"}>Summary</Text>
    </Flex>
    
    <Box style={{ height: '2px', backgroundColor: 'var(--gray-5)', flex: 1, margin: '0 8px' }} />
    
    <Flex gap="2" align="center">
      <Box
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: currentStep === "payment" ? 'var(--accent-9)' : 'var(--gray-5)',
          color: currentStep === "payment" ? 'white' : 'var(--gray-11)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
        }}
      >
        3
      </Box>
      <Text size="2" weight={currentStep === "payment" ? "bold" : "regular"}>Payment</Text>
    </Flex>
  </Flex>
);

// Menu step component
const MenuStep = ({ 
  selectedCategory,
  setSelectedCategory,
  categories,
  filteredMenuItems,
  openItemModal,
  orderItems,
  subtotal,
  goToSummary,
}: { 
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: { title: string; icon: React.ReactNode }[];
  filteredMenuItems: MenuItem[];
  openItemModal: (item: MenuItem) => void;
  orderItems: OrderItem[];
  subtotal: number;
  goToSummary: () => void;
}) => (
  <Box style={{ 
    display: 'flex', 
    flexDirection: 'column',
  }}>
    {/* Category selector - fixed below header */}
    <Box style={{ 
      position: 'fixed',
      top: '32px', // Below header
      left: 0,
      right: 0,
      zIndex: 9,
      backgroundColor: 'white',
      borderBottom: '1px solid var(--gray-5)',
      margin: '0 auto',
      width: '100%'
    }}>
      <ScrollArea scrollbars="horizontal" size="1">
        <Flex gap="2" justify="center" py="1" px="2">
          {categories.map(category => (
            <Button 
              key={category.title}
              variant={selectedCategory === category.title ? "solid" : "soft"}
              onClick={() => setSelectedCategory(category.title)}
              size="1"
              className="flex-shrink-0"
            >
              <Flex align="center" gap="1">
                <span>{category.icon}</span>
                <span>{category.title}</span>
              </Flex>
            </Button>
          ))}
        </Flex>
      </ScrollArea>
    </Box>
    
    {/* Menu items - scrollable content */}
    <Box className="pt-[80px] pb-8">
      <Grid columns="2" gap="4">
        {filteredMenuItems.map((item) => (
          <Card 
            key={item.id} 
            className="cursor-pointer" 
            size="1"
            onClick={() => openItemModal(item)}
          >
            <Inset clip="padding-box" side="top" pb="current">
              <Image 
                src={item.image} 
                alt={item.name} 
                width={242}
                height={100}
                style={{
                  display: "block",
                  objectFit: "cover",
                  width: "242px",
                  height: "100px",
                  backgroundColor: "var(--gray-5)",
                }}
              />
            </Inset>
            <Flex direction="column" gap="1" p="2">
              <Text weight="medium">{item.name}</Text>
              <Text size="1" color="gray" style={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.2em',
                maxHeight: '2.4em'
              }}>
                {item.description}
              </Text>
              <Text size="2" weight="bold">${item.price.toFixed(2)}</Text>
            </Flex>
          </Card>
        ))}
      </Grid>
    </Box>
    
    {/* Floating action button */}
    {orderItems.length > 0 && (
      <Box position="fixed" bottom="4" left="0" right="0" style={{ 
        padding: '0 16px',
        maxWidth: '500px',
        margin: '0 auto',
        zIndex: 20
      }}>
        <Button 
          size="4"
          onClick={goToSummary}
          style={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          color="green"
        >
          <Flex justify="between" width="100%">
            <Text>View Order ({orderItems.length} items)</Text>
            <Flex align="center" gap="1">
              <Text weight="bold">${subtotal.toFixed(2)}</Text>
              <ArrowRight size={18} />
            </Flex>
          </Flex>
        </Button>
      </Box>
    )}
  </Box>
);

// Order summary step component
const SummaryStep = ({
  orderItems,
  menuItems,
  removeOrderItem,
  updateOrderItemQuantity,
  customerName,
  handleCustomerNameChange,
  tableNumber,
  handleTableNumberChange,
  subtotal,
  taxAmount,
  total,
  goToPayment,
}: {
  orderItems: OrderItem[];
  menuItems: MenuItem[];
  removeOrderItem: (itemId: number) => void;
  updateOrderItemQuantity: (itemId: number, newQuantity: number) => void;
  customerName: string;
  handleCustomerNameChange: (value: string) => void;
  tableNumber: string;
  handleTableNumberChange: (value: string) => void;
  subtotal: number;
  taxAmount: number;
  total: number;
  goToPayment: () => void;
}) => (
  <Box style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
    <Flex direction="column" gap="4" height="100%">
      {/* Order items */}
      <Box style={{ flex: 1, overflow: 'hidden' }}>
        <Text size="4" weight="bold" mb="2">Your Order</Text>
        <ScrollArea style={{ height: 'calc(100% - 40px)' }} type="always" scrollbars="vertical">
          {orderItems.map((item) => (
            <Card key={item.id} my="2">
              <Flex direction="column" p="3">
                <Flex justify="between" align="start">
                  <Flex gap="3" align="start">
                    <Box style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
                      <Image 
                        src={menuItems.find(menuItem => menuItem.name === item.name)?.image || ''}
                        alt={item.name}
                        width={40}
                        height={40}
                        style={{ objectFit: 'cover', borderRadius: '4px', width: '40px', height: '40px' }}
                      />
                    </Box>
                    <Box>
                      <Heading size="2">{item.name}</Heading>
                      {item.size && <Box key={item.size}><Text size="1" color="gray">Size: {item.size}</Text></Box>}
                      {item.addons && item.addons.map(addon => (
                        <Box key={addon.id}><Text size="1" color="gray">+ {addon.name} (${addon.price.toFixed(2)})</Text></Box>
                      ))}
                      {item.notes && <Box><Text size="1" color="gray" style={{fontStyle: "italic"}}>Note: {item.notes}</Text></Box>}
                    </Box>
                  </Flex>
                  <IconButton 
                    variant="ghost" 
                    size="1" 
                    color="red"
                    onClick={() => removeOrderItem(item.id)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Flex>
                <Flex justify="end" align="center" gap="4" mt="2">
                  <Flex align="center" gap="2">
                    <IconButton 
                      variant="soft" 
                      size="1"
                      onClick={() => updateOrderItemQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </IconButton>
                    <Text size="2">{item.quantity}</Text>
                    <IconButton 
                      variant="soft" 
                      size="1"
                      onClick={() => updateOrderItemQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </IconButton>
                  </Flex>
                  <Text weight="medium">${item.totalPrice.toFixed(2)}</Text>
                </Flex>
              </Flex>
            </Card>
          ))}
        </ScrollArea>
      </Box>

      {/* Customer info */}
      <Card>
        <Flex direction="column" gap="3" p="3">
          <Text weight="bold">Customer Information</Text>
          <Flex direction="column" gap="2">
            <Text size="2">Name (optional)</Text>
            <TextField.Root
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => handleCustomerNameChange(e.target.value)}
              size="2"
              variant="surface"
              autoComplete="off"
              spellCheck="false"
            />
          </Flex>
          <Flex direction="column" gap="2">
            <Text size="2">Table Number</Text>
            <TextField.Root
              placeholder="Enter table number"
              value={tableNumber}
              onChange={(e) => handleTableNumberChange(e.target.value)}
              size="2"
              variant="surface"
              autoComplete="off"
              spellCheck="false"
            />
          </Flex>
        </Flex>
      </Card>

      {/* Order summary */}
      <Card>
        <Box p="3">
          <Flex justify="between" mb="2">
            <Text>Subtotal</Text>
            <Text>${subtotal.toFixed(2)}</Text>
          </Flex>
          <Flex justify="between" mb="2">
            <Text>Tax (8%)</Text>
            <Text>${taxAmount.toFixed(2)}</Text>
          </Flex>
          <Flex justify="between" mb="2" style={{ borderTop: '1px solid var(--gray-5)', paddingTop: '8px' }}>
            <Text weight="bold">Total</Text>
            <Text weight="bold">${total.toFixed(2)}</Text>
          </Flex>
        </Box>
      </Card>

      {/* Continue button */}
      <Button 
        size="3" 
        onClick={goToPayment} 
        color="green"
        style={{ marginTop: 'auto' }}
      >
        Continue to Payment
      </Button>
    </Flex>
  </Box>
);

// Item detail modal component
const ItemDetailModal = ({
  selectedItem,
  closeItemModal,
  quantity,
  decrementQuantity,
  incrementQuantity,
  selectedSize,
  setSelectedSize,
  selectedAddons,
  toggleAddon,
  itemNotes,
  handleItemNotesChange,
  calculateItemPrice,
  addToOrder,
}: {
  selectedItem: MenuItem;
  closeItemModal: () => void;
  quantity: number;
  decrementQuantity: () => void;
  incrementQuantity: () => void;
  selectedSize: string | null;
  setSelectedSize: (size: string) => void;
  selectedAddons: number[];
  toggleAddon: (addonId: number) => void;
  itemNotes: string;
  handleItemNotesChange: (value: string) => void;
  calculateItemPrice: () => number;
  addToOrder: () => void;
}) => {
  if (!selectedItem) return null;
  
  return (
    <Dialog.Root open={!!selectedItem} onOpenChange={closeItemModal}>
      <Dialog.Content>
        <Flex justify="between" mb="2">
          <Dialog.Title>{selectedItem.name}</Dialog.Title>
          <Dialog.Close>
            <IconButton variant="ghost" color="gray">
              <X size={18} />
            </IconButton>
          </Dialog.Close>
        </Flex>

        <ScrollArea type="always" scrollbars="vertical" className="pb-4 pr-4" style={{ overscrollBehavior: 'none' }}>
          <Flex direction="column" gap="3" style={{ paddingBottom: '60px', maxHeight: '400px' }}>
            {/* Item Image */}
            <Flex gap="2">
              <Image 
                src={selectedItem.image} 
                alt={selectedItem.name} 
                width={100}
                height={100}
                style={{ objectFit: 'cover', borderRadius: '8px', width: '100px', height: '100px' }}
              />
              <Dialog.Description size="2" color="gray">{selectedItem.description}</Dialog.Description>
            </Flex>
            
            {/* Quantity Selector */}
            <Box>
              <Text mb="2">Quantity</Text>
              <Flex align="center" gap="2">
                <IconButton variant="outline" onClick={decrementQuantity}>
                  <Minus size={16} />
                </IconButton>
                <Text style={{ width: '40px', textAlign: 'center' }}>{quantity}</Text>
                <IconButton variant="outline" onClick={incrementQuantity}>
                  <Plus size={16} />
                </IconButton>
              </Flex>
            </Box>
            
            {/* Size Selection */}
            {selectedItem.sizes && (
              <Flex direction="column" gap="2">
                <Text>Size</Text>
                <RadioCards.Root
                  onValueChange={setSelectedSize}
                  defaultValue={selectedSize || undefined}
                >
                  {selectedItem.sizes.map(size => (
                    <RadioCards.Item
                      key={size.name} 
                      value={size.name}
                    >
                      <Text weight="medium">{size.name} - ${size.price.toFixed(2)}</Text>
                    </RadioCards.Item>
                  ))}
                </RadioCards.Root>
              </Flex>
            )}
            
            {/* Add-ons */}
            {selectedItem.addons && selectedItem.addons.length > 0 && (
              <Flex direction="column" gap="2">
                <Text>Add-ons</Text>
                <Flex wrap="wrap" gap="2">
                  {selectedItem.addons.map(addon => (
                    <Card 
                      key={addon.id}
                      className="cursor-pointer p-2"
                      style={{
                        borderColor: selectedAddons.includes(addon.id) ? 'var(--accent-9)' : 'var(--gray-6)',
                        borderWidth: selectedAddons.includes(addon.id) ? '2px' : '1px',
                        borderStyle: 'solid',
                      }}
                      onClick={() => toggleAddon(addon.id)}
                    >
                      <Flex align="center" gap="2">
                        <Box style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          border: '1px solid var(--gray-8)',
                          backgroundColor: selectedAddons.includes(addon.id) ? 'var(--accent-9)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {selectedAddons.includes(addon.id) && <Text style={{ color: 'white' }} size="1">✓</Text>}
                        </Box>
                        <Text>{addon.name} (+${addon.price.toFixed(2)})</Text>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              </Flex>
            )}
            
            {/* Notes Field */}
            <Flex direction="column" gap="2">
              <Text>Special Instructions</Text>
              <TextArea
                placeholder="Add special instructions here..."
                value={itemNotes}
                onChange={(e) => handleItemNotesChange(e.target.value)}
                size="2"
                variant="surface"
                resize="none"
                rows={2}
                autoComplete="off"
                spellCheck="false"
              />
            </Flex>
          </Flex>
        </ScrollArea>
        {/* Total and Add to Order Button */}
        <Box style={{ 
            borderTop: '1px solid var(--gray-5)', 
            paddingTop: '16px',
            marginTop: 'auto',
            width: '100%',
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'white',
            zIndex: 10
          }}>
            <Flex justify="between" align="center" mb="3">
              <Text weight="bold">Total:</Text>
              <Text weight="bold">${calculateItemPrice().toFixed(2)}</Text>
            </Flex>
            
            <Flex gap="2">
              <Button size="3" variant="outline" onClick={closeItemModal} className="flex-1">
                Cancel
              </Button>
              <Button size="3" onClick={addToOrder} className="flex-1" color="green">
                <Plus size={16} />
                Add to Order
              </Button>
            </Flex>
          </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

// Payment step component
const PaymentStep = ({
  orderItems,
  subtotal,
  taxAmount,
  total,
  paymentMethod,
  setPaymentMethod,
  completeOrder,
}: {
  orderItems: OrderItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  completeOrder: () => void;
}) => (
  <Box style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
    <Flex direction="column" gap="4" height="100%">
      {/* Order summary */}
      <Card>
        <Box p="3">
          <Text weight="bold" mb="2">Order Summary</Text>
          <Flex justify="between" mb="2">
            <Text>{orderItems.length} items</Text>
            <Text>${subtotal.toFixed(2)}</Text>
          </Flex>
          <Flex justify="between" mb="2">
            <Text>Tax (8%)</Text>
            <Text>${taxAmount.toFixed(2)}</Text>
          </Flex>
          <Flex justify="between" mb="2" style={{ borderTop: '1px solid var(--gray-5)', paddingTop: '8px' }}>
            <Text weight="bold">Total</Text>
            <Text weight="bold">${total.toFixed(2)}</Text>
          </Flex>
        </Box>
      </Card>

      {/* Payment methods */}
      <Card>
        <Box p="3">
          <Text weight="bold">Payment Method</Text>
          <RadioCards.Root
            value={paymentMethod}
            onValueChange={setPaymentMethod}
            mt="2"
          >
            <RadioCards.Item value="cashier">
              <Flex align="center" gap="2">
                <Wallet size={18} />
                <Text>Pay at Cashier</Text>
              </Flex>
            </RadioCards.Item>
            <RadioCards.Item value="card">
              <Flex align="center" gap="2">
                <CreditCard size={18} />
                <Text>Credit/Debit Card</Text>
              </Flex>
            </RadioCards.Item>
          </RadioCards.Root>
        </Box>
      </Card>

      {/* Payment details - only show if card payment selected */}
      {paymentMethod === "card" && (
        <Card>
          <Box p="3">
            <Text weight="bold" mb="3">Card Details</Text>
            <Box py="4">
              <Text size="2" color="gray" align="center">
                Card payment will be processed at the table by our staff with a mobile payment terminal.
              </Text>
            </Box>
          </Box>
        </Card>
      )}

      {/* Submit order button */}
      <Button 
        size="3" 
        onClick={completeOrder} 
        color="green"
      >
        <Send size={18} />
        Place Order
      </Button>
    </Flex>
  </Box>
);

// Success step component
const SuccessStep = ({
  orderNumber,
  tableNumber,
  orderItems,
  total,
  paymentMethod,
  resetOrder,
}: {
  orderNumber: string;
  tableNumber: string;
  orderItems: OrderItem[];
  total: number;
  paymentMethod: string;
  resetOrder: () => void;
}) => (
  <Box style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
    <Card size="3" style={{ maxWidth: '400px', width: '100%' }}>
      <Flex direction="column" gap="5" align="center">
        <Box style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--green-5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          <Text style={{ fontSize: '40px' }}>✓</Text>
        </Box>
        
        <Box>
          <Heading size="5" align="center" mb="2">Order Placed Successfully!</Heading>
          <Text size="2" color="gray" align="center" mb="4">
            Your order has been received and is being prepared.
          </Text>
        </Box>
        
        <Card style={{ width: '100%', border: '1px solid var(--gray-5)' }}>
          <Flex direction="column" gap="3" p="3">
            <Flex justify="between">
              <Text weight="bold">Order Number:</Text>
              <Text>{orderNumber}</Text>
            </Flex>
            
            {tableNumber && (
              <Flex justify="between">
                <Text weight="bold">Table:</Text>
                <Text>{tableNumber}</Text>
              </Flex>
            )}
            
            <Flex justify="between">
              <Text weight="bold">Items:</Text>
              <Text>{orderItems.length}</Text>
            </Flex>
            
            <Flex justify="between">
              <Text weight="bold">Total:</Text>
              <Text>${total.toFixed(2)}</Text>
            </Flex>
            
            <Flex justify="between">
              <Text weight="bold">Payment:</Text>
              <Text>{paymentMethod === "cashier" ? "Pay at Cashier" : "Card Payment"}</Text>
            </Flex>
          </Flex>
        </Card>
        
        <Button 
          size="3" 
          onClick={resetOrder} 
          style={{ width: '100%' }}
        >
          Return to Menu
        </Button>
      </Flex>
    </Card>
  </Box>
);

export default function OrderMobilePage() {
  const { accentColor } = useAccentColor();
  // Step management
  const [currentStep, setCurrentStep] = useState<OrderStep>("menu");
  
  // Order state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Dishes");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [itemNotes, setItemNotes] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cashier");
  const [customerName, setCustomerName] = useState<string>("");
  const [tableNumber, setTableNumber] = useState<string>("");
  const [orderNumber, setOrderNumber] = useState<string>("");
  
  // Categories for menu filtering
  const categories = [
    {
      title: "All Dishes",
      icon: <ChefHatIcon size={14} />
    }, 
    {
      title: "Main",
      icon: <ForkKnife size={14} />
    }, 
    {
      title: "Sides",
      icon: <Sandwich size={14} />
    }, 
    {
      title: "Desserts",
      icon: <Cake size={14} />
    }, 
    {
      title: "Drinks",
      icon: <Coffee size={14} />
    }
  ];
  
  // Sample menu items
  const menuItems: MenuItem[] = [
    { 
      id: 1, 
      name: "Classic Burger", 
      price: 9.99, 
      category: "Main",
      description: "Juicy beef patty with lettuce, tomato, and special sauce",
      image: "/images/order/burger.jpg",
      sizes: [
        { name: "Small", price: 9.99 },
        { name: "Medium", price: 11.99 },
        { name: "Large", price: 13.99 }
      ],
      addons: [
        { id: 101, name: "Extra Cheese", price: 1.50 },
        { id: 102, name: "Bacon", price: 2.00 }
      ]
    },
    { 
      id: 2, 
      name: "Margherita Pizza", 
      price: 12.99, 
      category: "Main",
      description: "Traditional pizza with tomato sauce, mozzarella, and basil",
      image: "/images/order/pizza.jpg",
      sizes: [
        { name: "Small", price: 12.99 },
        { name: "Medium", price: 15.99 },
        { name: "Large", price: 18.99 }
      ],
      addons: [
        { id: 201, name: "Extra Cheese", price: 2.00 },
        { id: 202, name: "Mushrooms", price: 1.50 }
      ]
    },
    { 
      id: 3, 
      name: "French Fries", 
      price: 4.99, 
      category: "Sides",
      description: "Crispy golden fries with sea salt",
      image: "/images/order/fries.jpg",
      sizes: [
        { name: "Small", price: 4.99 },
        { name: "Medium", price: 5.99 },
        { name: "Large", price: 6.99 }
      ],
      addons: [
        { id: 301, name: "Cheese Sauce", price: 1.00 },
        { id: 302, name: "Truffle Oil", price: 2.50 }
      ]
    },
    { 
      id: 4, 
      name: "Chocolate Cake", 
      price: 6.99, 
      category: "Desserts",
      description: "Rich chocolate cake with fudge frosting",
      image: "/images/order/cake.jpg"
    },
    { 
      id: 5, 
      name: "Iced Coffee", 
      price: 3.99, 
      category: "Drinks",
      description: "Cold brewed coffee served over ice",
      image: "/images/order/coffee.jpg",
      sizes: [
        { name: "Small", price: 3.99 },
        { name: "Medium", price: 4.99 },
        { name: "Large", price: 5.99 }
      ],
      addons: [
        { id: 501, name: "Vanilla Syrup", price: 0.50 },
        { id: 502, name: "Whipped Cream", price: 0.75 }
      ]
    },
    {
      id: 6,
      name: "Coke",
      price: 2.99,
      category: "Drinks",
      description: "Classic Coca-Cola",
      image: "/images/order/coke.jpg",
    },
    {
      id: 7,
      name: "Sprite",
      price: 2.99,
      category: "Drinks",
      description: "Classic Sprite",
      image: "/images/order/sprite.jpg",
    },
    {
      id: 8,
      name: "Sparkling Water",
      price: 1.99,
      category: "Drinks",
      description: "Classic Sparkling Water",
      image: "/images/order/water.jpg",
    },
    {
      id: 9,
      name: "Ice Tea",
      price: 2.99,
      category: "Drinks",
      description: "Classic Ice Tea",
      image: "/images/order/tea.jpg",
    },
  ];
  
  // Filter menu items based on selected category
  const filteredMenuItems = selectedCategory === "All Dishes" 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  // Item detail modal functions
  const openItemModal = (item: MenuItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setSelectedSize(item.sizes ? item.sizes[0].name : null);
    setSelectedAddons([]);
    setItemNotes("");
  };

  const closeItemModal = () => {
    setSelectedItem(null);
  };

  // Quantity management
  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // Addon management
  const toggleAddon = (addonId: number) => {
    setSelectedAddons(prev => 
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  // Price calculation
  const calculateItemPrice = () => {
    if (!selectedItem) return 0;
    
    // Base price based on selected size
    let basePrice = selectedItem.price;
    if (selectedItem.sizes && selectedSize) {
      const size = selectedItem.sizes.find(s => s.name === selectedSize);
      if (size) basePrice = size.price;
    }
    
    // Add addon prices
    let addonTotal = 0;
    if (selectedItem.addons) {
      selectedItem.addons.forEach(addon => {
        if (selectedAddons.includes(addon.id)) {
          addonTotal += addon.price;
        }
      });
    }
    
    return (basePrice + addonTotal) * quantity;
  };

  // Add item to order
  const addToOrder = () => {
    if (!selectedItem) return;
    
    const basePrice = selectedItem.sizes && selectedSize
      ? selectedItem.sizes.find(s => s.name === selectedSize)?.price || selectedItem.price
      : selectedItem.price;
    
    const selectedAddonItems = selectedItem.addons
      ? selectedItem.addons.filter(addon => selectedAddons.includes(addon.id))
      : [];
    
    const totalPrice = calculateItemPrice();
    
    const newItem: OrderItem = {
      id: Date.now(), // Use timestamp as unique ID for order items
      name: selectedItem.name,
      basePrice,
      quantity,
      size: selectedSize || undefined,
      addons: selectedAddonItems.length > 0 ? selectedAddonItems : undefined,
      notes: itemNotes.trim() || undefined,
      totalPrice
    };
    
    setOrderItems(prev => [...prev, newItem]);
    closeItemModal();
  };

  // Order item management
  const removeOrderItem = (itemId: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateOrderItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setOrderItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const unitPrice = item.totalPrice / item.quantity;
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: unitPrice * newQuantity
        };
      }
      return item;
    }));
  };

  // Price calculations
  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = 0.08; // 8% tax rate
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  
  // Navigation between steps
  const goToSummary = () => {
    setCurrentStep("summary");
  };
  
  const goToPayment = () => {
    setCurrentStep("payment");
  };
  
  const goBack = () => {
    if (currentStep === "summary") {
      setCurrentStep("menu");
    } else if (currentStep === "payment") {
      setCurrentStep("summary");
    }
  };
  
  const completeOrder = () => {
    // Generate a random order number (in a real app this would come from the backend)
    const newOrderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderNumber(newOrderNumber);
    
    // Move to success screen instead of showing an alert
    setCurrentStep("success");
  };
  
  const resetOrder = () => {
    // Reset all order-related state
    setOrderItems([]);
    setCustomerName("");
    setTableNumber("");
    setPaymentMethod("cashier");
    setCurrentStep("menu");
  };
  
  return (
    <Box style={{ position: 'relative' }}>
      <Box className="mx-auto" style={{ height: '100%', maxWidth: '500px', position: 'relative' }}>  
        {currentStep !== "success" && <Header currentStep={currentStep} goBack={goBack} accentColor={accentColor} />}
        {currentStep !== "success" && currentStep !== "menu" && (
          <Box style={{ paddingTop: '40px' }}>
            <StepIndicator currentStep={currentStep} />
          </Box>
        )}
        
        {currentStep === "menu" && (
          <MenuStep 
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            filteredMenuItems={filteredMenuItems}
            openItemModal={openItemModal}
            orderItems={orderItems}
            subtotal={subtotal}
            goToSummary={goToSummary}
          />
        )}
        
        {currentStep === "summary" && (
          <SummaryStep 
            orderItems={orderItems}
            menuItems={menuItems}
            removeOrderItem={removeOrderItem}
            updateOrderItemQuantity={updateOrderItemQuantity}
            customerName={customerName}
            handleCustomerNameChange={setCustomerName}
            tableNumber={tableNumber}
            handleTableNumberChange={setTableNumber}
            subtotal={subtotal}
            taxAmount={taxAmount}
            total={total}
            goToPayment={goToPayment}
          />
        )}
        
        {currentStep === "payment" && (
          <PaymentStep 
            orderItems={orderItems}
            subtotal={subtotal}
            taxAmount={taxAmount}
            total={total}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            completeOrder={completeOrder}
          />
        )}
        
        {currentStep === "success" && (
          <SuccessStep 
            orderNumber={orderNumber}
            tableNumber={tableNumber}
            orderItems={orderItems}
            total={total}
            paymentMethod={paymentMethod}
            resetOrder={resetOrder}
          />
        )}
        
        {selectedItem && (
          <ItemDetailModal 
            selectedItem={selectedItem}
            closeItemModal={closeItemModal}
            quantity={quantity}
            decrementQuantity={decrementQuantity}
            incrementQuantity={incrementQuantity}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            selectedAddons={selectedAddons}
            toggleAddon={toggleAddon}
            itemNotes={itemNotes}
            handleItemNotesChange={setItemNotes}
            calculateItemPrice={calculateItemPrice}
            addToOrder={addToOrder}
          />
        )}
      </Box>
    </Box>
  );
}
