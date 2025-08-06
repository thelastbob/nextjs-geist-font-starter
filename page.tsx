'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/lib/language'
import { useVehicles } from '@/lib/data-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DocumentModal } from '@/components/DocumentModal'

export default function VehiclesPage() {
  const { isAuthenticated, hasPermission } = useAuth()
  const { language, t } = useLanguage()
  const { vehicles, loading, error, deleteVehicle } = useVehicles()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all')
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  if (!isAuthenticated) {
    return null
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const search = searchTerm.toLowerCase()
    const fieldsToSearch = [
      vehicle.assetNo,
      vehicle.plateNo,
      vehicle.vinNo
    ]
    const matchesSearch = fieldsToSearch.some(field => (field?.toLowerCase() ?? '').includes(search))
    
    const matchesFilter = filterStatus === 'all' || vehicle.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">{t('vehicles.active')}</Badge>
      case 'expiring_soon':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t('vehicles.expiring_soon')}</Badge>
      case 'expired':
        return <Badge variant="destructive">{t('vehicles.expired')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleDelete = async (id: string, assetName: string) => {
    if (confirm(`${t('message.confirm_delete')} ${assetName}?`)) {
      try {
        await deleteVehicle(id)
      } catch (error) {
        console.error('Failed to delete vehicle:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('vehicles.title')}</h1>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? `إجمالي المركبات: ${vehicles.length}` 
              : `Total vehicles: ${vehicles.length}`
            }
          </p>
        </div>
        
        {hasPermission('admin') && (
          <div className="flex gap-2">
            <Link href="/vehicles/new">
              <Button>{t('vehicles.add')}</Button>
            </Link>
            <Link href="/vehicles/import">
              <Button variant="outline">
                {language === 'ar' ? 'استيراد CSV' : 'Import CSV'}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={language === 'ar' ? 'البحث في المركبات...' : 'Search vehicles...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            {language === 'ar' ? 'الكل' : 'All'}
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('active')}
          >
            {t('vehicles.active')}
          </Button>
          <Button
            variant={filterStatus === 'expiring_soon' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('expiring_soon')}
          >
            {t('vehicles.expiring_soon')}
          </Button>
          <Button
            variant={filterStatus === 'expired' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('expired')}
          >
            {t('vehicles.expired')}
          </Button>
        </div>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== 'all'
                ? (language === 'ar' ? 'لا توجد مركبات تطابق البحث' : 'No vehicles match your search')
                : (language === 'ar' ? 'لا توجد مركبات' : 'No vehicles found')
              }
            </p>
            {hasPermission('admin') && (
              <Link href="/vehicles/new">
                <Button className="mt-4">{t('vehicles.add')}</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{vehicle.assetName}</CardTitle>
                    <CardDescription>
                      {vehicle.brand} {vehicle.model} - {vehicle.year}
                    </CardDescription>
                  </div>
                  {getStatusBadge(vehicle.status)}
                </div>
              </CardHeader>
              
            <CardContent className="space-y-4">
                {/* Vehicle Image */}
                {vehicle.images && vehicle.images.length > 0 && (
                  <div className="aspect-video relative overflow-hidden rounded-lg">
                    <img
                      src={vehicle.images[0]}
                      alt={`صورة المركبة ${vehicle.assetName}`}
                    className="w-full h-full object-contain rounded-md"
                      onError={(e) => {
                        e.currentTarget.src = 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/53a5713d-049d-4957-a1fc-8e2ec28ffbac.png'
                      }}
                    />
                  </div>
                )}
                
                {/* Vehicle Details */}
                <div className="space-y-2 text-sm">
                  <div><strong>{t('vehicles.assetName')}:</strong> {vehicle.assetName}</div>
                  <div><strong>{t('vehicles.assetNo')}:</strong> <span className="text-blue-600 font-bold">{vehicle.assetNo}</span></div>
                  <div><strong>{t('vehicles.vinNo')}:</strong> <span className="text-amber-700 font-bold">{vehicle.vinNo}</span></div>
                  <div><strong>{t('vehicles.year')}:</strong> {vehicle.year}</div>
                  <div><strong>{t('vehicles.plateNo')}:</strong> <span className="text-purple-800 font-bold">{vehicle.plateNo}</span></div>
                  <div><strong>{t('vehicles.description')}:</strong> {vehicle.description}</div>
                  <div><strong>{t('vehicles.assetType')}:</strong> {vehicle.assetType}</div>
                  <div><strong>{t('vehicles.location')}:</strong> {vehicle.location}</div>
                  <div><strong>{t('vehicles.status')}:</strong> {vehicle.status}</div>
                </div>

                {/* Expiry Dates */}
                <div className="space-y-1 text-xs">
                  {vehicle.insuranceExpiry && (
                    <div className="flex justify-between">
                      <span>{t('vehicles.insurance')}:</span>
                      <span className={new Date(vehicle.insuranceExpiry) < new Date() ? 'text-red-600' : ''}>
                        {new Date(vehicle.insuranceExpiry).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                  )}
                  {vehicle.licenseExpiry && (
                    <div className="flex justify-between">
                      <span>{t('vehicles.license')}:</span>
                      <span className={new Date(vehicle.licenseExpiry) < new Date() ? 'text-red-600' : ''}>
                        {new Date(vehicle.licenseExpiry).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                  )}
                  {vehicle.inspectionExpiry && (
                    <div className="flex justify-between">
                      <span>{t('vehicles.inspection')}:</span>
                      <span className={new Date(vehicle.inspectionExpiry) < new Date() ? 'text-red-600' : ''}>
                        {new Date(vehicle.inspectionExpiry).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                    className="flex items-center gap-2 rounded-full border border-blue-600 text-blue-600 px-4 py-1 text-sm font-semibold hover:bg-blue-50"
                    title={t('vehicles.view')}
                    type="button"
                    aria-label={t('vehicles.view')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{language === 'ar' ? 'عرض الكل' : 'View All'}</span>
                  </button>

                  {['license', 'insurance', 'tuv', 'operationCard'].map((docType) => {
                    const doc = vehicle.documents?.find(d => d.type === docType)
                    if (!doc) return null
                    const colors: Record<string, string> = {
                      license: 'bg-purple-600 hover:bg-purple-700',
                      insurance: 'bg-green-600 hover:bg-green-700',
                      tuv: 'bg-yellow-600 hover:bg-yellow-700',
                      operationCard: 'bg-blue-600 hover:bg-blue-700'
                    }
                    const shapes: Record<string, string> = {
                      license: 'rounded-md w-8 h-8',
                      insurance: 'rounded-full w-8 h-8',
                      tuv: 'rounded-full w-16 h-8',
                      operationCard: 'rotate-45 w-8 h-8'
                    }
                    return (
                      <button
                        key={docType}
                        onClick={() => window.open(doc.filePath, '_blank')}
                        className={`${shapes[docType]} text-white ${colors[docType]} flex items-center justify-center`}
                        title={language === 'ar' ? `عرض ${t('vehicles.' + docType)}` : `View ${t('vehicles.' + docType)}`}
                        type="button"
                      >
                        <span className="sr-only">{language === 'ar' ? `عرض ${t('vehicles.' + docType)}` : `View ${t('vehicles.' + docType)}`}</span>
                      </button>
                    )
                  })}

                  {hasPermission('admin') && (
                    <>
                      <button
                        onClick={() => router.push(`/vehicles/${vehicle.id}/edit`)}
                        className="rounded-full w-10 h-10 border-2 border-blue-600 hover:bg-blue-100 text-blue-600 flex items-center justify-center"
                        title={t('vehicles.edit')}
                        type="button"
                        aria-label={t('vehicles.edit')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5h2m-1 1v12m-4-6h8" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id, vehicle.assetName)}
                        className="rounded-full w-10 h-10 border-2 border-red-600 hover:bg-red-100 text-red-600 flex items-center justify-center"
                        title={t('vehicles.delete')}
                        type="button"
                        aria-label={t('vehicles.delete')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
