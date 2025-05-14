// App.jsx - complete file with onDeleteStep handler included
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
  const [tags, setTags] = useState("");
  const [steps, setSteps] = useState([{ id: uuidv4(), step_number: 1, instruction: "", tools: "", parts: "", photo: "" }]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sops, setSops] = useState([]);
  const [sopThumbnails, setSopThumbnails] = useState({});
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [prevPanel, setPrevPanel] = useState("library");
  const [isEditing, setIsEditing] = useState(false);
  const [editSopId, setEditSopId] = useState(null);

  const handleStepChange = (index, field, value) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const handleAddStep = () => {
    setSteps([...steps, { id: uuidv4(), step_number: steps.length + 1, instruction: "", tools: "", parts: "", photo: "" }]);
  };

  const handleDeleteStep = (index) => {
    const updated = [...steps];
    updated.splice(index, 1);
    setSteps(updated.map((step, i) => ({ ...step, step_number: i + 1 })));
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

  const handleMoveStepUp = (index) => {
    if (index === 0) return;
    const updated = [...steps];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setSteps(updated.map((step, i) => ({ ...step, step_number: i + 1 })));
  };

  const handleMoveStepDown = (index) => {
    if (index === steps.length - 1) return;
    const updated = [...steps];
    [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
    setSteps(updated.map((step, i) => ({ ...step, step_number: i + 1 })));
  };

  const handleSaveSop = async () => {
    if (isEditing && editSopId) {
      await supabase.from("sops").update({ name: processName, description, tags }).eq("id", editSopId);
      const { data: existingSteps } = await supabase.from("sop_steps").select("id").eq("sop_id", editSopId);
      const existingIds = new Set((existingSteps || []).map(s => s.id));
      const currentIds = new Set(steps.map(s => s.id));

      for (const step of steps) {
        if (existingIds.has(step.id)) {
          await supabase.from("sop_steps").update({
            step_number: step.step_number,
            instruction: step.instruction,
            tools: step.tools,
            parts: step.parts,
            photo: step.photo
          }).eq("id", step.id);
        } else {
          await supabase.from("sop_steps").insert({
            id: step.id,
            sop_id: editSopId,
            step_number: step.step_number,
            instruction: step.instruction,
            tools: step.tools,
            parts: step.parts,
            photo: step.photo
          });
        }
      }

      for (const id of [...existingIds]) {
        if (!currentIds.has(id)) {
          const { error } = await supabase.from("sop_steps").delete().eq("id", id);
          if (error) console.error("Failed to delete step:", error);
        }
      }
    } else {
      const sopId = uuidv4();
      await supabase.from("sops").insert({
        id: sopId,
        name: processName || "Untitled SOP",
        description,
        tags
      });
      for (const step of steps) {
        await supabase.from("sop_steps").insert({
          id: step.id,
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
    setTags("");
    setSteps([{ id: uuidv4(), step_number: 1, instruction: "", tools: "", parts: "", photo: "" }]);
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
    const { data: loadedSteps } = await supabase.from("sop_steps").select("*").eq("sop_id", sop.id).order("step_number");
    setSteps((loadedSteps || []).map((step) => ({ ...step })));
    setProcessName(sop.name);
    setDescription(sop.description);
    setTags(sop.tags);
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
    setTags("");
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

  const filteredSops = searchTerm
    ? sops.filter(sop => {
        const lower = searchTerm.toLowerCase();
        return sop.name.toLowerCase().includes(lower) || (sop.tags || "").toLowerCase().includes(lower);
      })
    : [];

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
          onDeleteStep={handleDeleteStep}
          onUpload={handleFileUpload}
          onSave={handleSaveSop}
          setProcessName={setProcessName}
          setDescription={setDescription}
          setTags={setTags}
          onImageClick={handleImageClick}
          onMoveStepUp={handleMoveStepUp}
          onMoveStepDown={handleMoveStepDown}
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
