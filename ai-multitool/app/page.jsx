"use client";

import { useMemo, useState } from "react";
import ToolUI from "./components/ToolUI";
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Text,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  ClipboardList,
  Code2,
  FileText,
  HelpCircle,
  Instagram,
  Mail,
  Megaphone,
  MessageSquare,
  Moon,
  Palette,
  RefreshCw,
  Search,
  ShoppingBag,
  Sun,
  Youtube,
} from "lucide-react";

// ==============================
// 16 AI TOOLS
// ==============================
const TOOLS = {
  blog: {
    title: "Blog Generator",
    icon: FileText,
    fields: [{ name: "topic", label: "Topic", type: "text" }],
    basePrompt: "Write a blog post about {{topic}}",
  },
  email: {
    title: "Email Writer",
    icon: Mail,
    fields: [{ name: "purpose", label: "Purpose", type: "text" }],
    basePrompt: "Write an email for {{purpose}}",
  },
  rewriter: {
    title: "Text Rewriter",
    icon: RefreshCw,
    fields: [{ name: "text", label: "Text to rewrite", type: "textarea" }],
    basePrompt: "Rewrite the following text: {{text}}",
  },
  notes: {
    title: "Notes Summarizer",
    icon: BookOpen,
    fields: [{ name: "text", label: "Text to summarize", type: "textarea" }],
    basePrompt: "Summarize the following: {{text}}",
  },
  caption: {
    title: "Caption Writer",
    icon: Instagram,
    fields: [{ name: "description", label: "Post description", type: "text" }],
    basePrompt: "Write social media captions for {{description}}",
  },
  adcopy: {
    title: "Ad Copy Generator",
    icon: Megaphone,
    fields: [{ name: "product", label: "Product", type: "text" }],
    basePrompt: "Write ad copy for {{product}}",
  },
  seo: {
    title: "SEO Generator",
    icon: Search,
    fields: [{ name: "topic", label: "Topic", type: "text" }],
    basePrompt: "Generate SEO keywords and a meta description for {{topic}}",
  },
  logo: {
    title: "Logo Generator",
    icon: Palette,
    fields: [{ name: "brandName", label: "Brand name", type: "text" }],
    basePrompt: "Generate logo concept ideas for {{brandName}}",
  },
  chatbot: {
    title: "AI Chatbot",
    icon: MessageSquare,
    fields: [{ name: "message", label: "Message", type: "textarea" }],
    basePrompt: "Reply conversationally to: {{message}}",
  },
  resume: {
    title: "Resume Builder",
    icon: ClipboardList,
    fields: [{ name: "details", label: "Career details", type: "textarea" }],
    basePrompt: "Build a resume section from: {{details}}",
  },
  youtube: {
    title: "YouTube Script",
    icon: Youtube,
    fields: [{ name: "idea", label: "Video idea", type: "text" }],
    basePrompt: "Write a YouTube script about {{idea}}",
  },
  code: {
    title: "Code Generator",
    icon: Code2,
    fields: [{ name: "task", label: "Task", type: "textarea" }],
    basePrompt: "Generate code for {{task}}",
  },
  story: {
    title: "Story Generator",
    icon: BookMarked,
    fields: [{ name: "idea", label: "Idea", type: "text" }],
    basePrompt: "Write a short story about {{idea}}",
  },
  interview: {
    title: "Interview Q&A",
    icon: HelpCircle,
    fields: [{ name: "role", label: "Role", type: "text" }],
    basePrompt: "Generate interview questions and answers for {{role}}",
  },
  product: {
    title: "Product Description",
    icon: ShoppingBag,
    fields: [{ name: "product", label: "Product", type: "text" }],
    basePrompt: "Write a product description for {{product}}",
  },
  social: {
    title: "Social Media Posts",
    icon: BarChart3,
    fields: [{ name: "topic", label: "Topic", type: "text" }],
    basePrompt: "Create social media posts about {{topic}}",
  },
};

// ==============================
// CONTROLS
// ==============================
const CONTROL_OPTIONS = {
  type: ["Informative", "Creative", "Persuasive", "Professional"],
  tone: ["Friendly", "Formal", "Funny", "Sales"],
  length: ["Short", "Medium", "Long"],
  style: ["Simple", "Advanced", "Viral"],
};

export default function Home() {
  const [selectedTool, setSelectedTool] = useState("blog");
  const [search, setSearch] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: true });
  const { colorMode, toggleColorMode } = useColorMode();

  const [controls, setControls] = useState({
    type: "Informative",
    tone: "Professional",
    length: "Medium",
    style: "Simple",
  });

  const currentTool = TOOLS[selectedTool];
  const CurrentIcon = currentTool.icon;

  const filteredToolKeys = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return Object.keys(TOOLS);
    return Object.keys(TOOLS).filter((key) =>
      TOOLS[key].title.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <Flex minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      {/* ================= TOOL SELECTOR ================= */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Choose a tool</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <InputGroup mb={4}>
              <InputLeftElement pointerEvents="none">
                <Search size={16} />
              </InputLeftElement>
              <Input
                placeholder="Search tools..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
              {filteredToolKeys.map((key) => {
                const ToolIcon = TOOLS[key].icon;
                const isSelected = key === selectedTool;
                return (
                  <Button
                    key={key}
                    size="sm"
                    justifyContent="flex-start"
                    leftIcon={<ToolIcon size={16} />}
                    colorScheme={isSelected ? "teal" : "gray"}
                    variant={isSelected ? "solid" : "outline"}
                    onClick={() => {
                      setSelectedTool(key);
                      setSearch("");
                      onClose();
                    }}
                  >
                    {TOOLS[key].title}
                  </Button>
                );
              })}
            </SimpleGrid>

            {filteredToolKeys.length === 0 && (
              <Text color="gray.500" fontSize="sm" mt={2}>
                No tools match &quot;{search}&quot;.
              </Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ================= MAIN ================= */}
      <Box flex="1" p={{ base: 3, md: 6 }} maxW="1100px" mx="auto" w="100%">
        {/* HEADER */}
        <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
          <HStack spacing={3}>
            <CurrentIcon size={22} />
            <Box>
              <Heading size="md">{currentTool.title}</Heading>
              <Text fontSize="sm" color="gray.500">
                AI Multi Tool Suite
              </Text>
            </Box>
          </HStack>

          <HStack spacing={2}>
            <Button size="sm" variant="outline" colorScheme="teal" onClick={onOpen}>
              Change tool
            </Button>
            <IconButton
              size="sm"
              variant="outline"
              aria-label="Toggle color mode"
              icon={colorMode === "light" ? <Moon size={16} /> : <Sun size={16} />}
              onClick={toggleColorMode}
            />
            <Badge colorScheme="green">PRO</Badge>
          </HStack>
        </Flex>

        <Divider mb={4} />

        {/* CONTROLS */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={6}>
          {Object.keys(CONTROL_OPTIONS).map((key) => (
            <Box key={key}>
              <Text fontSize="xs" fontWeight="bold" mb={1} textTransform="capitalize">
                {key}
              </Text>
              <Select
                size="sm"
                value={controls[key]}
                onChange={(e) =>
                  setControls((prev) => ({ ...prev, [key]: e.target.value }))
                }
              >
                {CONTROL_OPTIONS[key].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </Box>
          ))}
        </SimpleGrid>

        {/* TOOL UI */}
        <Box
          bg="white"
          _dark={{ bg: "gray.800" }}
          p={{ base: 3, md: 6 }}
          borderRadius="xl"
          boxShadow="sm"
        >
          {/* key={selectedTool} forces a clean remount (and state reset) per tool */}
          <ToolUI key={selectedTool} tool={currentTool} controls={controls} />
        </Box>
      </Box>
    </Flex>
  );
}
