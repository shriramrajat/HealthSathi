'use client'

import React, { useState, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Upload, FileText, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

import { Medication, Prescription } from '@/lib/types/dashboard-models'
import { medicationSchema, prescriptionSchema } from '@/lib/validation/dashboard-schemas'
import { FileValidator } from '@/lib/firebase/storage-utils'

// Form validation schema
const prescriptionFormSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  notes: z.string().min(1, 'Prescription notes are required'),
  medications: z.array(medicationSchema).min(1, 'At least one medication is required'),
  appointmentId: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'expired']).default('active')
})

type PrescriptionFormData = z.infer<typeof prescriptionFormSchema>

interface PrescriptionCreatorProps {
  patientId?: string
  appointmentId?: string
  onSubmit: (data: PrescriptionFormData, file?: File) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  patients?: Array<{ id: string; name: string }>
}

export function PrescriptionCreator({
  patientId,
  appointmentId,
  onSubmit,
  onCancel,
  isLoading = false,
  patients = []
}: PrescriptionCreatorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<'form' | 'upload'>('form')

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      patientId: patientId || '',
      appointmentId: appointmentId || '',
      diagnosis: '',
      notes: '',
      medications: [
        {
          name: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: '',
          quantity: 1,
          refills: 0,
          genericAllowed: true
        }
      ],
      status: 'active'
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medications'
  })

  // File upload handling
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = FileValidator.validatePrescriptionFile(file)
    if (!validation.isValid) {
      setFileError(validation.error || 'Invalid file')
      setSelectedFile(null)
      return
    }

    setFileError('')
    setSelectedFile(file)
  }, [])

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null)
    setFileError('')
    setUploadProgress(0)
  }, [])

  // Add new medication
  const addMedication = useCallback(() => {
    append({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      quantity: 1,
      refills: 0,
      genericAllowed: true
    })
  }, [append])

  // Remove medication
  const removeMedication = useCallback((index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }, [remove, fields.length])

  // Form submission
  const onFormSubmit = useCallback(async (data: PrescriptionFormData) => {
    try {
      await onSubmit(data, selectedFile || undefined)
    } catch (error) {
      console.error('Error submitting prescription:', error)
    }
  }, [onSubmit, selectedFile])

  // Common medication frequencies
  const frequencies = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'As needed',
    'Before meals',
    'After meals',
    'At bedtime'
  ]

  // Common durations
  const durations = [
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '14 days',
    '21 days',
    '30 days',
    '60 days',
    '90 days',
    'Until finished',
    'As needed',
    'Ongoing'
  ]

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Create Prescription
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'form' | 'upload')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Type Prescription</TabsTrigger>
            <TabsTrigger value="upload">Upload File</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-6">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient *</Label>
                {patientId ? (
                  <Input
                    value={patients.find(p => p.id === patientId)?.name || 'Selected Patient'}
                    disabled
                    className="bg-gray-50"
                  />
                ) : (
                  <Select
                    value={watch('patientId')}
                    onValueChange={(value) => setValue('patientId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.patientId && (
                  <p className="text-sm text-red-600">{errors.patientId.message}</p>
                )}
              </div>

              {/* Diagnosis */}
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis *</Label>
                <Input
                  id="diagnosis"
                  {...register('diagnosis')}
                  placeholder="Enter diagnosis"
                  className={errors.diagnosis ? 'border-red-500' : ''}
                />
                {errors.diagnosis && (
                  <p className="text-sm text-red-600">{errors.diagnosis.message}</p>
                )}
              </div>

              {/* Medications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Medications *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMedication}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Medication
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Medication {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedication(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Medication Name */}
                      <div className="space-y-2">
                        <Label htmlFor={`medications.${index}.name`}>Medication Name *</Label>
                        <Input
                          {...register(`medications.${index}.name`)}
                          placeholder="Enter medication name"
                          className={errors.medications?.[index]?.name ? 'border-red-500' : ''}
                        />
                        {errors.medications?.[index]?.name && (
                          <p className="text-sm text-red-600">
                            {errors.medications[index]?.name?.message}
                          </p>
                        )}
                      </div>

                      {/* Dosage */}
                      <div className="space-y-2">
                        <Label htmlFor={`medications.${index}.dosage`}>Dosage *</Label>
                        <Input
                          {...register(`medications.${index}.dosage`)}
                          placeholder="e.g., 500mg, 1 tablet"
                          className={errors.medications?.[index]?.dosage ? 'border-red-500' : ''}
                        />
                        {errors.medications?.[index]?.dosage && (
                          <p className="text-sm text-red-600">
                            {errors.medications[index]?.dosage?.message}
                          </p>
                        )}
                      </div>

                      {/* Frequency */}
                      <div className="space-y-2">
                        <Label htmlFor={`medications.${index}.frequency`}>Frequency *</Label>
                        <Select
                          value={watch(`medications.${index}.frequency`)}
                          onValueChange={(value) => setValue(`medications.${index}.frequency`, value)}
                        >
                          <SelectTrigger className={errors.medications?.[index]?.frequency ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencies.map((freq) => (
                              <SelectItem key={freq} value={freq}>
                                {freq}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.medications?.[index]?.frequency && (
                          <p className="text-sm text-red-600">
                            {errors.medications[index]?.frequency?.message}
                          </p>
                        )}
                      </div>

                      {/* Duration */}
                      <div className="space-y-2">
                        <Label htmlFor={`medications.${index}.duration`}>Duration *</Label>
                        <Select
                          value={watch(`medications.${index}.duration`)}
                          onValueChange={(value) => setValue(`medications.${index}.duration`, value)}
                        >
                          <SelectTrigger className={errors.medications?.[index]?.duration ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {durations.map((duration) => (
                              <SelectItem key={duration} value={duration}>
                                {duration}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.medications?.[index]?.duration && (
                          <p className="text-sm text-red-600">
                            {errors.medications[index]?.duration?.message}
                          </p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="space-y-2">
                        <Label htmlFor={`medications.${index}.quantity`}>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          {...register(`medications.${index}.quantity`, { valueAsNumber: true })}
                          placeholder="Enter quantity"
                        />
                      </div>

                      {/* Refills */}
                      <div className="space-y-2">
                        <Label htmlFor={`medications.${index}.refills`}>Refills</Label>
                        <Input
                          type="number"
                          min="0"
                          max="12"
                          {...register(`medications.${index}.refills`, { valueAsNumber: true })}
                          placeholder="Number of refills"
                        />
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-2 mt-4">
                      <Label htmlFor={`medications.${index}.instructions`}>Instructions *</Label>
                      <Textarea
                        {...register(`medications.${index}.instructions`)}
                        placeholder="Special instructions for taking this medication"
                        className={errors.medications?.[index]?.instructions ? 'border-red-500' : ''}
                        rows={2}
                      />
                      {errors.medications?.[index]?.instructions && (
                        <p className="text-sm text-red-600">
                          {errors.medications[index]?.instructions?.message}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}

                {errors.medications && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please fill in all required medication fields.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Prescription Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Prescription Notes *</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Additional notes, warnings, or instructions for the patient"
                  className={errors.notes ? 'border-red-500' : ''}
                  rows={3}
                />
                {errors.notes && (
                  <p className="text-sm text-red-600">{errors.notes.message}</p>
                )}
              </div>

              <Separator />

              {/* Form Actions */}
              <div className="flex justify-end gap-3">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={!isValid || isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? 'Creating...' : 'Create Prescription'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Upload Prescription File</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a PDF, JPG, or PNG file of the prescription (max 10MB)
                </p>
              </div>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="prescription-file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="prescription-file"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <Upload className="h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium">Click to upload prescription</p>
                    <p className="text-sm text-gray-500">PDF, JPG, PNG up to 10MB</p>
                  </div>
                </label>
              </div>

              {/* File Error */}
              {fileError && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-600">
                    {fileError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Selected File */}
              {selectedFile && (
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Basic Form Fields for File Upload */}
              {selectedFile && (
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                  {/* Patient Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="patientId">Patient *</Label>
                    {patientId ? (
                      <Input
                        value={patients.find(p => p.id === patientId)?.name || 'Selected Patient'}
                        disabled
                        className="bg-gray-50"
                      />
                    ) : (
                      <Select
                        value={watch('patientId')}
                        onValueChange={(value) => setValue('patientId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {errors.patientId && (
                      <p className="text-sm text-red-600">{errors.patientId.message}</p>
                    )}
                  </div>

                  {/* Diagnosis */}
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Diagnosis *</Label>
                    <Input
                      id="diagnosis"
                      {...register('diagnosis')}
                      placeholder="Enter diagnosis"
                      className={errors.diagnosis ? 'border-red-500' : ''}
                    />
                    {errors.diagnosis && (
                      <p className="text-sm text-red-600">{errors.diagnosis.message}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes *</Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Additional notes about this prescription"
                      className={errors.notes ? 'border-red-500' : ''}
                      rows={3}
                    />
                    {errors.notes && (
                      <p className="text-sm text-red-600">{errors.notes.message}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3">
                    {onCancel && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="min-w-[120px]"
                    >
                      {isLoading ? 'Uploading...' : 'Upload Prescription'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}