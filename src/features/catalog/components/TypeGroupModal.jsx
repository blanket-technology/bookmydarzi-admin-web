import { useState } from "react";
import { Shirt, Diamond } from "lucide-react";
import FormModal, { Field } from "../../../components/common/FormModal.jsx";
import ImageUploadField from "../../../components/common/ImageUploadField.jsx";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { INPUT_CLASS as inp, CATALOG_IMAGE_UPLOAD_PATH } from "../constants/catalogConstants.js";
import * as catalogService from "../services/catalogService.js";

export default function TypeGroupModal({ lineName, categoryId, serviceLineId, onClose, onSaved }) {
  const [typeName, setTypeName] = useState("");
  const [addNormal, setAddNormal] = useState(true);
  const [addDesigner, setAddDesigner] = useState(true);
  const [normalPrice, setNormalPrice] = useState("");
  const [designerPrice, setDesignerPrice] = useState("");
  const [normalImage, setNormalImage] = useState("");
  const [designerImage, setDesignerImage] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const trimmedType = typeName.trim();
  const normalName = trimmedType ? `Normal ${trimmedType}` : "";
  const designerName = trimmedType ? `Designer ${trimmedType}` : "";

  const handleSave = async (e) => {
    e.preventDefault();
    if (!trimmedType) { setError("Enter a type name."); return; }
    if (!addNormal && !addDesigner) { setError("Select at least one quality (Normal or Designer)."); return; }
    if (addNormal && !normalPrice) { setError("Enter a price for Normal."); return; }
    if (addDesigner && !designerPrice) { setError("Enter a price for Designer."); return; }

    setSaving(true); setError("");
    try {
      await catalogService.createTypeGroupServices({
        categoryId,
        serviceLineId,
        normalName,
        designerName,
        normalPrice,
        designerPrice,
        normalImage,
        designerImage,
        deliveryDays,
        addNormal,
        addDesigner,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Save failed."));
    } finally { setSaving(false); }
  };

  return (
    <FormModal
      title={`Add ${lineName} Type`}
      subtitle={`in ${lineName}`}
      onClose={onClose}
      onSubmit={handleSave}
      submitLabel="Create Type"
      submitting={saving}
      message={error ? { type: "error", text: error } : undefined}
    >
      <Field label="Type Name *">
        <input
          required
          className={inp}
          value={typeName}
          onChange={(e) => setTypeName(e.target.value)}
          placeholder={`e.g. Formal ${lineName}, Casual ${lineName}, Chinese Collar`}
        />
        {trimmedType && (
          <p className="text-xs text-gray-400 mt-1">
            Will create: <span className="font-mono text-teal-700">{normalName}</span> and <span className="font-mono text-amber-700">{designerName}</span>
          </p>
        )}
      </Field>

      <Field label="Delivery Days">
        <input type="number" min="1" className={inp} value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} />
      </Field>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-600">Qualities to create</p>

        <div className={`border-2 rounded-xl p-3 transition-colors ${addNormal ? "border-teal-400 bg-teal-50" : "border-gray-200 bg-gray-50 opacity-60"}`}>
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input type="checkbox" className="w-4 h-4 accent-teal-700" checked={addNormal} onChange={(e) => setAddNormal(e.target.checked)} />
            <Shirt size={14} className="text-teal-600" />
            <span className="text-sm font-bold text-teal-800">Normal</span>
            <span className="text-xs text-teal-600 ml-auto">everyday finish</span>
          </label>
          {addNormal && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 shrink-0">₹</span>
                <input
                  type="number" min="0" required={addNormal}
                  className={inp + " flex-1"}
                  value={normalPrice} onChange={(e) => setNormalPrice(e.target.value)}
                  placeholder="Price"
                />
              </div>
              <ImageUploadField value={normalImage} onChange={setNormalImage} uploadPath={CATALOG_IMAGE_UPLOAD_PATH} />
            </div>
          )}
        </div>

        <div className={`border-2 rounded-xl p-3 transition-colors ${addDesigner ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-gray-50 opacity-60"}`}>
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input type="checkbox" className="w-4 h-4 accent-amber-600" checked={addDesigner} onChange={(e) => setAddDesigner(e.target.checked)} />
            <Diamond size={14} className="text-amber-600" />
            <span className="text-sm font-bold text-amber-800">Designer</span>
            <span className="text-xs text-amber-600 ml-auto">premium finish</span>
          </label>
          {addDesigner && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 shrink-0">₹</span>
                <input
                  type="number" min="0" required={addDesigner}
                  className={inp + " flex-1"}
                  value={designerPrice} onChange={(e) => setDesignerPrice(e.target.value)}
                  placeholder="Price"
                />
              </div>
              <ImageUploadField value={designerImage} onChange={setDesignerImage} uploadPath={CATALOG_IMAGE_UPLOAD_PATH} />
            </div>
          )}
        </div>
      </div>
    </FormModal>
  );
}
