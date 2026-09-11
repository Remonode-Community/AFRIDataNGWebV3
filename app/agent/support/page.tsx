'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { Badge } from '@/components/shared/Badge';
import { MessageSquare, Clock } from 'lucide-react';

export default function AgentSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('open');

  useEffect(() => {
    setTickets([
      { id: 'TICKET001', subject: 'Account verification pending', category: 'Account', status: 'open', priority: 'high', created: '2024-01-24 10:30', last_reply: '2024-01-24 14:15', responses: 2 },
      { id: 'TICKET002', subject: 'Commission payment issue', category: 'Payment', status: 'open', priority: 'high', created: '2024-01-25 09:00', last_reply: '2024-01-25 09:30', responses: 1 },
      { id: 'TICKET003', subject: 'Referral code not working', category: 'Technical', status: 'resolved', priority: 'medium', created: '2024-01-20 11:00', last_reply: '2024-01-21 16:45', responses: 4 },
      { id: 'TICKET004', subject: 'Dashboard loading slow', category: 'Technical', status: 'resolved', priority: 'low', created: '2024-01-18 15:30', last_reply: '2024-01-19 10:00', responses: 2 },
    ]);
    setLoading(false);
  }, []);

  const filteredTickets = tickets.filter((ticket) =>
    selectedTab === 'all' ? true : ticket.status === selectedTab
  );

  const getPriorityColor = (priority: string): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'info';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Support</h1>
          <p className="text-sm text-[#6b7280] mt-1">Get help and track your support tickets</p>
        </div>
        <Button className="rounded-xl">Create Ticket</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Open Tickets</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">
            {tickets.filter((t) => t.status === 'open').length}
          </p>
        </Card>
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Resolved</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">
            {tickets.filter((t) => t.status === 'resolved').length}
          </p>
        </Card>
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Avg Response Time</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">2 hours</p>
        </Card>
      </div>

      <Card className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f1f5f9]">
          <div className="flex gap-2">
            {['open', 'resolved', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedTab === tab
                    ? 'bg-[#111827] text-white'
                    : 'text-[#6b7280] hover:bg-[#f8fafc]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#f1f5f9]">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="px-5 py-4 hover:bg-[#fafafa] transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-[#6b7280]">{ticket.id}</span>
                    <Badge variant={getPriorityColor(ticket.priority)} size="sm">{ticket.priority}</Badge>
                    <Badge variant={getStatusColor(ticket.status)} size="sm">{ticket.status}</Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-[#111827]">{ticket.subject}</h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-[#6b7280]">
                <span className="flex items-center gap-1"><MessageSquare size={12} />{ticket.category}</span>
                <span className="flex items-center gap-1"><Clock size={12} />Created: {ticket.created}</span>
                <span className="text-[#111827] font-medium">{ticket.responses} responses</span>
              </div>
              <div className="mt-3 pt-3 border-t border-[#f1f5f9] flex justify-between items-center">
                <span className="text-xs text-[#6b7280]">Last reply: {ticket.last_reply}</span>
                <button className="text-[#4a5ff7] hover:text-[#3a4fe7] font-medium text-xs">
                  View Ticket
                </button>
              </div>
            </div>
          ))}
          {filteredTickets.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-[#6b7280]">No tickets in this category</div>
          )}
        </div>
      </Card>

      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
        <h2 className="text-base font-bold text-[#111827] mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: 'How long does verification take?', a: 'Agent verification typically takes 1-2 business days after submission.' },
            { q: 'When are commissions paid?', a: 'Commissions are calculated daily and paid out every Monday.' },
            { q: 'How can I increase my commission rate?', a: 'Commission rates increase based on sales volume. Check the performance rewards section.' },
          ].map((faq, idx) => (
            <div key={idx} className="border-b border-[#f1f5f9] pb-3 last:border-b-0">
              <h3 className="text-sm font-semibold text-[#111827] mb-1">{faq.q}</h3>
              <p className="text-xs text-[#6b7280]">{faq.a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
