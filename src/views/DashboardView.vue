<script setup lang="ts">
import { useDashboard } from '../composables/useDashboard'
import OnboardingModal from '../components/modals/onboarding/OnboardingModal.vue'
import QuickAddModal from '../components/modals/dash/QuickAddModal.vue'
import WorkoutModal from '../components/modals/dash/WorkoutModal.vue'
import BiometricsModal from '../components/modals/dash/BiometricsModal.vue'
import DashboardHeader from '../components/layout/DashboardHeader.vue'
import DashboardSummaryCards from '../components/cards/DashboardSummaryCards.vue'
import DashboardTrackersSection from '../components/sections/DashboardTrackersSection.vue'
import DashboardTabSection from '../components/sections/DashboardTabSection.vue'
import DatePickerPopover from '../components/atoms/DatePickerPopover.vue'
import { Plus } from '@lucide/vue'

const {
  userProfile,
  authStore,
  showOnboardingModal,
  showAddModal,
  showWorkoutModal,
  showBiometricsModal,
  selectedDate,
  loggedDates,
  loading,
  activeTab,
  isOnboardingPending,
  filteredWorkouts,
  totalActiveCalories,
  biometrics,
  filteredBiometrics,
  latestWeight,
  latestBmi,
  formulaUsed,
  hasBodyFat,
  bmr,
  tdee,
  recommendedCalories,
  filteredWaterLogs,
  totalWaterMl,
  filteredMeals,
  totalCaloriesConsumed,
  totalProteinG,
  totalCarbsG,
  totalFatG,
  refreshFetchers,
  navigate,
  onOnboardingCompleted,
  handleUpdateProfilePrefs,
  updateCalorieTarget,
  handleSignOut,
  addWorkout,
  editWorkout,
  deleteWorkout,
  addBiometric,
  editBiometric,
  deleteBiometric,
  addWater,
  editWater,
  deleteWater,
  undoLastWater,
  updateWaterTarget,
  editMeal,
  deleteMeal
} = useDashboard()
</script>

<template>
  <div class="w-full">
    <!-- Progressive Onboarding Gate -->
    <OnboardingModal
      v-if="isOnboardingPending"
      :initial-profile="userProfile"
      :latest-biometric="biometrics[0] || null"
      @completed="onOnboardingCompleted"
      @dismiss="showOnboardingModal = false"
    />

    <!-- Quick Add Modal -->
    <QuickAddModal
      :show="showAddModal"
      @close="showAddModal = false"
      @select="(tab) => {
        showAddModal = false
        if (tab === 'meals') {
          navigate('/meals', false, { logDate: selectedDate })
        } else if (tab === 'workouts') {
          activeTab = 'workouts'
          showWorkoutModal = true
        } else if (tab === 'biometrics') {
          activeTab = 'biometrics'
          showBiometricsModal = true
        }
      }"
    />

    <!-- Standalone Workout Modal triggered via Quick Add -->
    <WorkoutModal
      :show="showWorkoutModal"
      @close="showWorkoutModal = false"
      @submit="addWorkout"
    />

    <!-- Standalone Biometrics Modal triggered via Quick Add -->
    <BiometricsModal
      :show="showBiometricsModal"
      @close="showBiometricsModal = false"
      @submit="addBiometric"
    />

    <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <!-- App Header & Profile Menu Component -->
      <DashboardHeader
        :user-profile="userProfile"
        :user-email="authStore.user.value?.email"
        :loading="loading"
        :fetchers="refreshFetchers"
        @open-onboarding="showOnboardingModal = true"
        @sign-out="handleSignOut"
      />

      <!-- Date Navigation Popover & Add Quick Action -->
      <div class="flex items-center justify-between gap-3">
        <DatePickerPopover v-model="selectedDate" :logged-dates="loggedDates" />
        <button
          type="button"
          @click="showAddModal = true"
          class="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition active:scale-95 shadow-md shadow-emerald-950/40 cursor-pointer"
          title="Quick Log"
        >
          <Plus class="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <!-- Summary Cards Grid (Scoped to selected date) -->
      <DashboardSummaryCards
        :total-active-calories="totalActiveCalories"
        :latest-weight="latestWeight"
        :latest-bmi="latestBmi"
        :protein-g="totalProteinG"
        :carbs-g="totalCarbsG"
        :fat-g="totalFatG"
        :is-loading="loading"
      />

      <!-- Main Metric Trackers: Animated Calories & Water Gauges Section -->
      <DashboardTrackersSection
        :consumed="totalCaloriesConsumed"
        :expenditure="totalActiveCalories"
        :target-cal="userProfile?.target_cal || 2000"
        :recommended-target="recommendedCalories"
        :bmr="bmr"
        :tdee="tdee"
        :formula-used="formulaUsed"
        :has-body-fat="hasBodyFat"
        :current-water-ml="totalWaterMl"
        :target-water-ml="userProfile?.target_water_ml || 2500"
        :can-undo-water="filteredWaterLogs.length > 0"
        :is-loading="loading"
        @update-calorie-target="updateCalorieTarget"
        @navigate-meals="navigate('/meals', false, { logDate: selectedDate, tab: 'summary' })"
        @add-water="addWater"
        @undo-water="undoLastWater"
        @update-water-target="updateWaterTarget"
      />

      <!-- Granular Tabbed Feature Sections Component (Scoped to selected date) -->
      <DashboardTabSection
        v-model="activeTab"
        :target-date="selectedDate"
        :workouts="filteredWorkouts"
        :biometrics="filteredBiometrics"
        :meals="filteredMeals"
        :water-logs="filteredWaterLogs"
        :micros-opt="userProfile?.micros_opt"
        :prefs="userProfile?.prefs"
        @add-workout="addWorkout"
        @edit-workout="editWorkout"
        @delete-workout="deleteWorkout"
        @add-biometric="addBiometric"
        @edit-biometric="editBiometric"
        @delete-biometric="deleteBiometric"
        @update-prefs="handleUpdateProfilePrefs"
        @log-meal="(slot) => navigate('/meals', false, { logDate: selectedDate, initialSlot: slot })"
        @edit-meal="editMeal"
        @delete-meal="deleteMeal"
        @update-micros="(id, newMicros) => {
          const m = filteredMeals.find(item => item.id === id)
          if (m) editMeal({ ...m, micros: newMicros })
        }"
        @add-water="addWater"
        @edit-water="editWater"
        @delete-water="deleteWater"
      />
    </div>
  </div>
</template>
