# Objective: Allocation Studio Redesign (Elevating Budget Templates)

The user has requested that **Budget Templates** become a first-class feature integrated directly into the **Fill Envelopes (Allocation Studio)** screen, rather than being hidden away in the Settings menu. 

Currently, the Allocation Studio treats manual entry as the primary action, with templates relegated to a secondary "Quick Fill" sidebar. This redesign will flip that hierarchy, making templates the central engine of the allocation process.

## 1. User Experience (UX) Goals

1. **Centralized Template Dashboard:** The Allocation Studio should no longer just be a blank form. It should default to displaying the user's **Active Template** front and center.
2. **Inline Editing:** Users should be able to tweak their Active Template *directly* on this screen without having to navigate to Settings. If they realize their rent went up, they change it right there while allocating their funds.
3. **Template Switching:** Users should easily be able to swap their Active Template from a dropdown or carousel directly within the Allocation Studio.
4. **Seamless Execution:** The barrier between "managing" a template and "executing" it should be eliminated. 

## 2. Proposed UI Layout for Allocation Studio

### Header Section
- **Title:** "Allocation Studio"
- **Active Template Selector:** A styled dropdown or toggle allowing the user to select which template is currently driving their budget (e.g., "Monthly Salary", "Side Hustle"). Changing this immediately updates the global Active Template.
- **Action Buttons:** "Create New Template", "Reconcile"

### Main Content Area (Split View)

#### **Left Panel: The Engine (Funding Source)**
- Instead of just asking for an "Incoming Amount", this panel focuses on the **Execution** phase.
- **Unallocated Balance Display:** Prominently show how much money is sitting waiting to be deployed.
- **Auto-Income Toggle:** Keep the "Add Auto Income to make it zero" toggle prominently displayed.
- **Execute Button:** A massive primary button: **"Distribute [Template Name]"** which immediately fires the template logic.
- **Manual Override Mode:** A small toggle to switch the view back to the "Old School" manual allocation mode if they just want to throw $50 into Groceries without invoking a template.

#### **Right Panel: The Blueprint (Template Editor)**
- This panel replaces the old manual allocation grid with the **Full Template Editor**.
- It displays the rows of the currently selected Active Template.
- Each row shows the Envelope Name and the Target Amount.
- **Inline Editing:** Clicking an amount lets the user edit it. Clicking the envelope name lets them change it.
- **Add/Remove:** Users can click "Add Row" to append a new envelope rule to the template right here, or click a trash can to remove one.
- **Sum Total:** At the bottom, a sticky footer showing the total capacity required by this template.

*(In essence, we are taking the `BudgetTemplateManager` from the Settings page and embedding it directly into the right side of the Allocation Studio).*

## 3. Technical Implementation Plan

### Step 1: Component Relocation & Refactoring
- **Move Components:** Extract the core logic of `BudgetTemplateManager` (currently in Settings) into a reusable `<InteractiveTemplateEditor />` component.
- **Update `FillClientPage.tsx`:** 
  - Remove the old manual allocation grid (`allocations` state).
  - Replace the right side of the screen with the `<InteractiveTemplateEditor />`.
  - Replace the small "Quick Fill Templates" box on the left with the **Active Template Selector**.

### Step 2: Backend Logic Updates
- Ensure `updateTemplateItem`, `addTemplateItem`, and `deleteTemplateItem` Server Actions revalidate the `/dashboard/fill` path so the UI stays snappy when editing inline.
- Ensure the Active Template state is fetched and loaded on initial render of the Allocation Studio.

### Step 3: Cleanup
- **Settings Page:** Remove the "Templates" tab from the Settings page entirely, as the Allocation Studio is now the sole home for template management.
- Update internal routing links that previously pointed to `/dashboard/settings?tab=templates` to point to `/dashboard/fill`.

## 4. User Review Required

> [!IMPORTANT]  
> Please review the proposed layout above and confirm if this matches your vision.
>
> **Key Question:** Are you comfortable with completely removing the old "Quick Fill" manual grid from this screen in favor of making the entire right-hand side a live Template Editor? Or do you still want a dedicated "Manual Mode" for one-off funding?
