document.addEventListener("DOMContentLoaded", async () => {
    const cycleTable = document.getElementById("auditCycleTable");
    const createBtn = document.getElementById("createCycleBtn");
    const createModal = document.getElementById("createCycleModal");
    const saveCreate = document.getElementById("saveCreate");
    const cancelCreate = document.getElementById("cancelCreate");
    const assetsModal = document.getElementById("assetsModal");
    const assetsTable = document.getElementById("assetsTable");
    const closeAssets = document.getElementById("closeAssets");
  
    // Load cycles
    async function loadCycles() {
      const cycles = await AssetFlowAPI.listAuditCycles();
      cycleTable.innerHTML = cycles.map(c => `
        <tr>
          <td>${c.name}</td>
          <td>${c.department}</td>
          <td>${c.start_date}</td>
          <td>${c.end_date}</td>
          <td>${c.is_closed ? "Closed" : "Open"}</td>
          <td>
            <button onclick="viewAssets(${c.id})">View Assets</button>
            ${!c.is_closed ? `<button onclick="closeCycle(${c.id})">Close</button>` : ""}
          </td>
        </tr>
      `).join("");
    }
    await loadCycles();
  
    // Create cycle modal
    createBtn.onclick = () => createModal.classList.remove("hidden");
    cancelCreate.onclick = () => createModal.classList.add("hidden");
    saveCreate.onclick = async () => {
      const newCycle = {
        name: document.getElementById("cycleName").value,
        department: document.getElementById("cycleDept").value,
        start_date: document.getElementById("cycleStart").value,
        end_date: document.getElementById("cycleEnd").value
      };
      await AssetFlowAPI.createAuditCycle(newCycle);
      createModal.classList.add("hidden");
      await loadCycles();
    };
  
    // Assets modal
    window.viewAssets = async (cycleId) => {
      const entries = await AssetFlowAPI.listAuditEntries({ cycle: cycleId });
      assetsTable.innerHTML = entries.map(a => `
        <tr>
          <td>${a.asset_tag}</td>
          <td>${a.asset_name}</td>
          <td>${a.status}</td>
          <td>
            <select onchange="updateAsset(${a.id}, this.value)">
              <option value="Verified" ${a.status==="Verified"?"selected":""}>Verified</option>
              <option value="Missing" ${a.status==="Missing"?"selected":""}>Missing</option>
              <option value="Damaged" ${a.status==="Damaged"?"selected":""}>Damaged</option>
            </select>
          </td>
        </tr>
      `).join("");
      assetsModal.classList.remove("hidden");
    };
  
    closeAssets.onclick = () => assetsModal.classList.add("hidden");
  
    window.updateAsset = async (id, status) => {
      await AssetFlowAPI.updateAuditEntry(id, status);
    };
  
    window.closeCycle = async (id) => {
      await AssetFlowAPI.closeAuditCycle(id);
      await loadCycles();
    };
  });
  