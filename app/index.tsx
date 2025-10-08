// app/index.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueAt?: string | null;
  priority?: "Low" | "Normal" | "High";
  remind?: boolean;
  remindAt?: string | null;
  repeat?: "none" | "daily" | "weekly";
  color?: string;
};

const STORAGE_KEY = "tasks_v6_fixed_with_name";
const NAME_KEY = "user_name_v1";
const DEFAULT_COLORS = ["#FF7A7A", "#8B5CF6", "#06B6D4", "#F59E0B"];

export default function TaskApp() {
  // user name
  const [name, setName] = useState<string | null>(null);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [tempName, setTempName] = useState("");

  // tasks & modal states (same as before)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [priority, setPriority] = useState<Task["priority"]>("Normal");
  const [remind, setRemind] = useState(false);
  const [remindAt, setRemindAt] = useState<Date | null>(null);
  const [repeat, setRepeat] = useState<Task["repeat"]>("none");
  const [color, setColor] = useState<string>(DEFAULT_COLORS[0]);

  // load name + tasks
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setTasks(JSON.parse(raw));
      } catch (e) {
        console.warn(e);
      }
      try {
        const savedName = await AsyncStorage.getItem(NAME_KEY);
        if (savedName) {
          setName(savedName);
        } else {
          // show name modal first run
          setTimeout(() => setNameModalVisible(true), 350);
        }
      } catch (e) {
        console.warn(e);
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // name functions
  const saveName = async () => {
    const trimmed = tempName.trim();
    if (!trimmed) return;
    setName(trimmed);
    await AsyncStorage.setItem(NAME_KEY, trimmed);
    setTempName("");
    setNameModalVisible(false);
  };

  const openChangeName = () => {
    setTempName(name ?? "");
    setNameModalVisible(true);
  };

  // task helpers
  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDueDate(null);
    setPriority("Normal");
    setRemind(false);
    setRemindAt(null);
    setRepeat("none");
    setColor(DEFAULT_COLORS[0]);
  };

  const openAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (t: Task) => {
    setEditingId(t.id);
    setTitle(t.title);
    setDescription(t.description ?? "");
    setDueDate(t.dueAt ? new Date(t.dueAt) : null);
    setPriority(t.priority ?? "Normal");
    setRemind(Boolean(t.remind));
    setRemindAt(t.remindAt ? new Date(t.remindAt) : null);
    setRepeat(t.repeat ?? "none");
    setColor(t.color ?? DEFAULT_COLORS[0]);
    setModalVisible(true);
  };

  const saveTask = () => {
    Keyboard.dismiss();
    if (!title.trim()) return;

    const task: Task = {
      id: editingId ?? Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      completed: false,
      dueAt: dueDate ? dueDate.toISOString() : null,
      priority,
      remind,
      remindAt: remindAt ? remindAt.toISOString() : null,
      repeat,
      color,
    };

    if (editingId) {
      setTasks((p) => p.map((x) => (x.id === editingId ? { ...x, ...task } : x)));
    } else {
      setTasks((p) => [task, ...p]);
    }

    setModalVisible(false);
    resetForm();
  };

  const toggleComplete = (id: string) =>
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  const removeTask = (id: string) => setTasks((p) => p.filter((t) => t.id !== id));

  // center empty text by letting FlatList contentContainerStyle flexGrow and justifyContent center
  const listContentStyle = { flexGrow: 1, justifyContent: "center", padding: 20, paddingBottom: 140 };

  // Date/time handlers
  function onDateChange(_: any, selected?: Date) {
    setShowDatePicker(false);
    if (selected) {
      if (dueDate) {
        const nd = new Date(dueDate);
        nd.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        setDueDate(nd);
      } else {
        setDueDate(selected);
      }
    }
  }

  function onTimeChange(_: any, selected?: Date) {
    setShowTimePicker(false);
    if (selected) {
      if (dueDate) {
        const nd = new Date(dueDate);
        nd.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setDueDate(nd);
      } else {
        const nd = new Date();
        nd.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setDueDate(nd);
      }
      if (!remindAt) {
        const r = new Date();
        r.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setRemindAt(r);
      }
    }
  }

  // sample quick add
  const addSample = () => {
    const now = new Date();
    const t: Task = {
      id: Date.now().toString(),
      title: "Sample: Prepare slides",
      description: "Prepare 5 slides for meeting",
      completed: false,
      dueAt: new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString(),
      priority: "High",
      remind: true,
      remindAt: new Date(now.getTime() + 1000 * 60 * 60 * 23).toISOString(),
      repeat: "none",
      color: DEFAULT_COLORS[1],
    };
    setTasks((p) => [t, ...p]);
  };

  // small UI components
  const Header = () => (
    <View style={styles.header}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.title}>
            Hello{" "}
            <Text style={{ color: "#FF7A7A" }}>{name ? name : "there"}</Text>{" "}
            <Text>👋</Text>
          </Text>
        </View>

        <TouchableOpacity onPress={openChangeName} style={styles.editNameBtn}>
          <Ionicons name="pencil" size={16} color="#444" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>{tasks.filter((t) => !t.completed).length} tasks are pending</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9aa0a6" />
        <TextInput style={styles.searchInput} placeholder="Search tasks..." placeholderTextColor="#9aa0a6" />
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="funnel-outline" size={18} color="#9aa0a6" />
        </TouchableOpacity>
      </View>

      <View style={styles.smallActionsRow}>
        <TouchableOpacity style={styles.ghostBtn} onPress={addSample}>
          <Text style={styles.ghostText}>Quick sample</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostBtn} onPress={() => setTasks([])}>
          <Text style={styles.ghostText}>Clear all</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const TaskRow = ({ item }: { item: Task }) => (
    <View style={styles.taskRow}>
      <TouchableOpacity onPress={() => toggleComplete(item.id)} style={[styles.marker, { backgroundColor: item.color ?? "#FF7A7A" }]}>
        {item.completed ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={[styles.taskTitle, item.completed && styles.taskDoneText]} numberOfLines={1}>
          {item.title}
        </Text>
        {item.description ? <Text style={styles.taskDesc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={styles.rowMeta}>
          <Text style={styles.metaText}>{item.priority ?? "Normal"}</Text>
          {item.dueAt ? <Text style={[styles.metaText, { marginLeft: 10 }]}>Due: {new Date(item.dueAt).toLocaleString()}</Text> : null}
          {item.repeat && item.repeat !== "none" ? <Text style={[styles.metaText, { marginLeft: 10 }]}>• {item.repeat}</Text> : null}
        </View>
      </View>

      <View style={styles.rowActions}>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
          <Ionicons name="pencil-outline" size={18} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removeTask(item.id)} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={18} color="#E05555" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const { width } = Dimensions.get("window");

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 24 : 24 }]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <FlatList
          data={tasks}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={<Header />}
          contentContainerStyle={listContentStyle}
          renderItem={({ item }) => <TaskRow item={item} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No tasks yet — tap + to add one</Text>}
        />

        {/* Floating Add Button (bottom center style like your mock) */}
        <View style={styles.addRow}>
          <TouchableOpacity style={[styles.addBtn, { width: width - 40 }]} onPress={openAdd}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.addBtnText}>Add New Task</Text>
          </TouchableOpacity>
        </View>

        {/* Task Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{editingId ? "Edit task" : "Add Task"}</Text>

              <TextInput placeholder="Task title" value={title} onChangeText={setTitle} style={styles.input} />
              <TextInput placeholder="Description (optional)" value={description} onChangeText={setDescription} style={[styles.input, { height: 80 }]} multiline />

              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={18} color="#444" />
                  <Text style={{ marginLeft: 8 }}>{dueDate ? dueDate.toLocaleDateString() : "Set due date"}</Text>
                </TouchableOpacity>

                <View style={{ width: 10 }} />

                <TouchableOpacity style={[styles.dateBtn]} onPress={() => setShowTimePicker(true)}>
                  <Ionicons name="time-outline" size={18} color="#444" />
                  <Text style={{ marginLeft: 8 }}>{dueDate ? dueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Set time"}</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={dueDate ?? new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onDateChange}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={dueDate ?? new Date()}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onTimeChange}
                />
              )}

              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#666", marginBottom: 6 }}>Priority</Text>
                  <View style={{ flexDirection: "row" }}>
                    <TouchableOpacity onPress={() => setPriority("Low")} style={[styles.priorityChip, priority === "Low" && styles.priorityActive]}>
                      <Text style={priority === "Low" ? styles.priorityTextActive : styles.priorityText}>Low</Text>
                    </TouchableOpacity>
                    <View style={{ width: 8 }} />
                    <TouchableOpacity onPress={() => setPriority("Normal")} style={[styles.priorityChip, priority === "Normal" && styles.priorityActive]}>
                      <Text style={priority === "Normal" ? styles.priorityTextActive : styles.priorityText}>Normal</Text>
                    </TouchableOpacity>
                    <View style={{ width: 8 }} />
                    <TouchableOpacity onPress={() => setPriority("High")} style={[styles.priorityChip, priority === "High" && styles.priorityActive]}>
                      <Text style={priority === "High" ? styles.priorityTextActive : styles.priorityText}>High</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ width: 12 }} />

                <View style={{ width: 120 }}>
                  <Text style={{ color: "#666", marginBottom: 6 }}>Repeat</Text>
                  <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                    <TouchableOpacity onPress={() => setRepeat("none")} style={[styles.repeatChip, repeat === "none" && styles.priorityActive]}>
                      <Text style={repeat === "none" ? styles.priorityTextActive : styles.priorityText}>None</Text>
                    </TouchableOpacity>
                    <View style={{ width: 6 }} />
                    <TouchableOpacity onPress={() => setRepeat("daily")} style={[styles.repeatChip, repeat === "daily" && styles.priorityActive]}>
                      <Text style={repeat === "daily" ? styles.priorityTextActive : styles.priorityText}>Daily</Text>
                    </TouchableOpacity>
                    <View style={{ width: 6 }} />
                    <TouchableOpacity onPress={() => setRepeat("weekly")} style={[styles.repeatChip, repeat === "weekly" && styles.priorityActive]}>
                      <Text style={repeat === "weekly" ? styles.priorityTextActive : styles.priorityText}>Weekly</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
                <Switch value={remind} onValueChange={setRemind} />
                <Text style={{ marginLeft: 10 }}>Set reminder</Text>

                {remind && (
                  <TouchableOpacity style={[styles.dateBtn, { marginLeft: 12 }]} onPress={() => setShowTimePicker(true)}>
                    <Ionicons name="alarm-outline" size={18} color="#444" />
                    <Text style={{ marginLeft: 8 }}>{remindAt ? remindAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Remind time"}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={{ color: "#666", marginBottom: 8 }}>Color</Text>
                <View style={{ flexDirection: "row" }}>
                  {DEFAULT_COLORS.map((c) => (
                    <TouchableOpacity key={c} onPress={() => setColor(c)} style={[styles.colorDot, { backgroundColor: c, borderWidth: color === c ? 2 : 0 }]} />
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={styles.cancelBtn}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveTask} style={styles.saveBtn}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>{editingId ? "Update" : "Save"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Name modal (shown on first run or edit) */}
        <Modal visible={nameModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Welcome 👋</Text>
              <Text style={{ marginBottom: 12 }}>What's your name?</Text>
              <TextInput placeholder="Enter your name" value={tempName} onChangeText={setTempName} style={styles.input} />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => { setNameModalVisible(false); setTempName(""); }} style={styles.cancelBtn}>
                  <Text>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveName} style={styles.saveBtn}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F2EFFF" },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", color: "#222" },
  subtitle: { color: "#666", marginTop: 6 },
  editNameBtn: { backgroundColor: "#fff", padding: 8, borderRadius: 10, alignItems: "center", justifyContent: "center", elevation: 1 },
  searchBar: { backgroundColor: "#fff", borderRadius: 12, padding: 10, marginTop: 12, flexDirection: "row", alignItems: "center", elevation: 2 },
  searchInput: { flex: 1, marginLeft: 8, color: "#333" },
  filterBtn: { padding: 8 },
  smallActionsRow: { flexDirection: "row", marginTop: 10 },
  ghostBtn: { backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderColor: "#eee", borderWidth: 1, marginRight: 8 },
  ghostText: { color: "#444", fontWeight: "700" },

  emptyText: { textAlign: "center", color: "#777", marginTop: 10 },

  taskRow: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fff", padding: 14, borderRadius: 14, marginBottom: 12, marginHorizontal: 0, marginTop: 8, elevation: 1 },
  marker: { width: 36, height: 36, borderRadius: 10, marginRight: 12, alignItems: "center", justifyContent: "center" },
  taskTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  taskDoneText: { textDecorationLine: "line-through", color: "#888", fontWeight: "600" },
  taskDesc: { marginTop: 6, color: "#666" },
  rowMeta: { flexDirection: "row", marginTop: 8, alignItems: "center" },
  metaText: { color: "#888", fontSize: 12 },
  rowActions: { marginLeft: 10, flexDirection: "row", alignItems: "center" },
  iconBtn: { paddingHorizontal: 8, paddingVertical: 6 },

  addRow: { position: "absolute", left: 20, right: 20, bottom: 28, alignItems: "center" },
  addBtn: { backgroundColor: "#FF7A7A", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 30, flexDirection: "row", alignItems: "center", justifyContent: "center", shadowColor: "#FF7A7A", shadowOpacity: 0.18, elevation: 8 },
  addBtnText: { color: "#fff", fontWeight: "700", marginLeft: 10 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.28)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalCard: { width: "100%", backgroundColor: "#fff", borderRadius: 18, padding: 18 },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, backgroundColor: "#FAFAFC", marginBottom: 8 },
  dateBtn: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#eee" },

  rowBetween: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginTop: 12 },
  priorityChip: { backgroundColor: "#fff", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#eee" },
  priorityActive: { backgroundColor: "#FFEEF0", borderColor: "#FF7A7A" },
  priorityText: { color: "#333", fontWeight: "700" },
  priorityTextActive: { color: "#FF4F6A", fontWeight: "800" },

  repeatChip: { backgroundColor: "#fff", paddingHorizontal: 8, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#eee" },

  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: "#ddd" },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: "#FF7A7A" },

  colorDot: { width: 36, height: 36, borderRadius: 10, marginRight: 10, borderColor: "#fff" },
});
