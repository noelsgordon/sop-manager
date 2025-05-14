// App.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XCircle, Pencil } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import "./index.css";
import Layout from "./components/Layout.jsx";
import Header from "./components/Header.jsx";
import Controls from "./components/Controls.jsx";
import SOPCard from "./components/SOPCard.jsx";
import Wizard from "./components/Wizard.jsx";
import SOPDetail from "./components/SOPDetail.jsx";

export default function App() {
  const [userRole, setUserRole] = useState("Viewer");
  const [activePanel, setActivePanel] = useState("home");
  const [activeSop, setActiveSop] = useState(null);
  const [processName, setProcessName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [steps, setSteps] = useState([{ step_number: 1, instruction: "", tools: "", parts: "", photo: "" }]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sops, setSops] = useState([]);
  const [sopThumbnails, setSopThumbnails] = useState({});
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [prevPanel, setPrevPanel] = useState("library");
  const [isEditing, setIsEditing] = useState(false);
  const [editSopId, setEditSopId] = useState(null);

  const highlightMatch = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, "gi");
    return text?.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const filteredSops = searchTerm
    ? sops.map((sop) => {
        const lower = searchTerm.toLowerCase();
        const nameMatch = sop.name?.toLowerCase().includes(lower);
        const descMatch = sop.description?.toLowerCase().includes(lower);
        const tagMatch = sop.tags?.toLowerCase().includes(lower);

        if (nameMatch || descMatch || tagMatch) {
          return {
            ...sop,
            _highlighted: {
              name: highlightMatch(sop.name, searchTerm),
              description: highlightMatch(sop.description, searchTerm),
            },
          };
        }
        return null;
      }).filter(Boolean)
    : [];

  const handleStepChange = (index, field, value) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const handleAddStep = () => {
    setSteps([...steps, { step_number: steps.length + 1, instruction: "", tools: "", parts: "", photo: "" }]);
  };

  const handleFileUpload = async (index, file) => {
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error: uploadError } = await supabase.storage.from('sop-images').upload(filePath, file);
    if (uploadError) {
      alert("Image upload failed");
      return;
    }
    const { data } = supabase.storage.from('sop-images').getPublicUrl(filePath);
    handleStepChange(index, "photo", data.publicUrl);
  };

  const handleSaveSop = async () => {
    const tagString = Array.isArray(tags) ? tags.join(",") : tags;

    if (isEditing && editSopId) {
      await supabase.from("sops").update({ name: processName, description, tags: tagString }).eq("id", editSopId);
      await supabase.from("sop_steps").delete().eq("sop_id", editSopId);
      for (const step of steps) {
        await supabase.from("sop_steps").insert({
          sop_id: editSopId,
          step_number: step.step_number,
          instruction: step.instruction,
          tools: step.tools,
          parts: step.parts,
          photo: step.photo
        });
      }
    } else {
      const sopId = uuidv4();
      const { error: sopError } = await supabase.from("sops").insert({
        id: sopId,
        name: processName || "Untitled SOP",
        description,
        tags: tagString
      });
      if (sopError) {
        alert("Failed to save SOP");
        return;
      }
      for (const step of steps) {
        await supabase.from("sop_steps").insert({
          sop_id: sopId,
          step_number: step.step_number,
          instruction: step.instruction,
          tools: step.tools,
          parts: step.parts,
          photo: step.photo
        });
      }
    }
    setProcessName("");
    setDescription("");
    setTags([]);
    setSteps([{ step_number: 1, instruction: "", tools: "", parts: "", photo: "" }]);
    setIsEditing(false);
    setEditSopId(null);
    setActivePanel("library");
    fetchSops();
  };

  const fetchSops = async () => {
    const { data: sopData } = await supabase.from("sops").select("*");
    setSops(sopData || []);
    const thumbs = {};
    for (const sop of sopData || []) {
      const { data: stepData } = await supabase.from("sop_steps").select("photo").eq("sop_id", sop.id).order("step_number").limit(1);
      if (stepData?.[0]?.photo) thumbs[sop.id] = stepData[0].photo;
    }
    setSopThumbnails(thumbs);
  };

  const handleSopSelect = async (sop) => {
    setPrevPanel(activePanel);
    setActiveSop(sop);
    const { data: steps } = await supabase.from("sop_steps").select("*").eq("sop_id", sop.id).order("step_number");
    setSteps(steps || []);
    setProcessName(sop.name);
    setDescription(sop.description);
    setTags(sop.tags ? sop.tags.split(",") : []);
    setActivePanel("detail");
  };

  const handleSetViewMode = (mode) => {
    setActivePanel(mode);
    setActiveSop(null);
    setSteps([]);
  };

  const handleCloseSopDetail = () => {
    setActiveSop(null);
    setSteps([]);
    setProcessName("");
    setDescription("");
    setTags([]);
    setActivePanel(prevPanel);
  };

  const handleImageClick = (url) => {
    setEnlargedImage(enlargedImage === url ? null : url);
  };

  const handleEditSop = () => {
    setIsEditing(true);
    setEditSopId(activeSop.id);
    setActivePanel("wizard");
  };

  useEffect(() => {
    fetchSops();
  }, []);

  return (
    <Layout
      sidebar={<Header userRole={userRole} setUserRole={setUserRole} setViewMode={handleSetViewMode} />}
      topbar={<Controls userRole={userRole} setViewMode={handleSetViewMode} />}
    >
      {activePanel === "library" && !activeSop && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sops.map(sop => (
            <SOPCard
              key={sop.id}
              sop={sop}
              thumbnail={sopThumbnails[sop.id]}
              onClick={() => handleSopSelect(sop)}
              onImageClick={handleImageClick}
            />
          ))}
        </div>
      )}

      {activePanel === "search" && !activeSop && (
        <div>
          <Input className="w-full mb-4"
            placeholder="Search SOPs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredSops.map(sop => (
              <SOPCard
                key={sop.id}
                sop={sop}
                thumbnail={sopThumbnails[sop.id]}
                onClick={() => handleSopSelect(sop)}
                onImageClick={handleImageClick}
              />
            ))}
          </div>
        </div>
      )}

      {activePanel === "detail" && activeSop && (
        <div className="mt-6">
          {userRole === "Updater" && (
            <Button onClick={handleEditSop} className="mb-4 mr-2">
              <Pencil className="inline-block mr-2" size={18} /> Edit
            </Button>
          )}
          <SOPDetail steps={steps} onImageClick={handleImageClick} />
          <Button onClick={handleCloseSopDetail} className="mt-4" variant="destructive">
            <XCircle className="inline-block mr-2" size={18} /> Close
          </Button>
        </div>
      )}

      {activePanel === "wizard" && (userRole === "Creator" || isEditing) && (
        <Wizard
          processName={processName}
          description={description}
          tags={tags}
          steps={steps}
          onChangeStep={handleStepChange}
          onAddStep={handleAddStep}
          onUpload={handleFileUpload}
          onSave={handleSaveSop}
          setProcessName={setProcessName}
          setDescription={setDescription}
          setTags={setTags}
          onImageClick={handleImageClick}
          isUpdateMode={isEditing}
          selectedSop={activeSop}
          onDeleteStep={(i) => setSteps(steps.filter((_, idx) => idx !== i))}
          onMoveStepUp={(i) => {
            if (i > 0) {
              const newSteps = [...steps];
              [newSteps[i - 1], newSteps[i]] = [newSteps[i], newSteps[i - 1]];
              setSteps(newSteps);
            }
          }}
          onMoveStepDown={(i) => {
            if (i < steps.length - 1) {
              const newSteps = [...steps];
              [newSteps[i], newSteps[i + 1]] = [newSteps[i + 1], newSteps[i]];
              setSteps(newSteps);
            }
          }}
        />
      )}

      {enlargedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={() => setEnlargedImage(null)}>
          <img src={enlargedImage} className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg border border-white" alt="enlarged" />
        </div>
      )}
    </Layout>
  );
}
