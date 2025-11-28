import Footer from "@/components/Footer";
import PublicHeader from "@/components/PublicHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              Política de Privacidade e Proteção de Dados
            </CardTitle>
            <p className="text-center text-sm text-gray-500 mt-2">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
            <p className="text-center text-sm font-semibold mt-2">
              Em conformidade com a Lei nº 13.709/2018 (LGPD)
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Introdução */}
            <section>
              <h2 className="text-xl font-bold mb-3">1. Introdução</h2>
              <p className="text-gray-700 leading-relaxed">
                O <strong>Cesta Justa</strong> é um sistema de gestão de distribuição de cestas básicas 
                comprometido com a proteção e privacidade dos dados pessoais dos titulares. Esta Política de 
                Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais, 
                em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </section>

            {/* Dados Coletados */}
            <section>
              <h2 className="text-xl font-bold mb-3">2. Dados Pessoais Coletados</h2>
              
              <h3 className="text-lg font-semibold mb-2 mt-4">2.1. Famílias Beneficiárias</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li><strong>Dados de identificação:</strong> Nome completo, CPF, endereço, telefone</li>
                <li><strong>Dados familiares:</strong> Nome da pessoa de contato, número de membros da família</li>
                <li><strong>Dados de histórico:</strong> Datas de entregas recebidas, períodos de bloqueio, instituição atendente</li>
                <li><strong>Observações:</strong> Notas sobre entregas (quando aplicável)</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">2.2. Usuários do Sistema</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li><strong>Dados de autenticação:</strong> Email, senha (criptografada)</li>
                <li><strong>Dados profissionais:</strong> Nome completo, função (administrador/instituição), instituição vinculada</li>
                <li><strong>Dados de auditoria:</strong> Registros de ações realizadas no sistema</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">2.3. Instituições Parceiras</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li><strong>Dados cadastrais:</strong> Nome, endereço, telefone</li>
                <li><strong>Dados operacionais:</strong> Famílias atendidas, entregas realizadas</li>
              </ul>
            </section>

            {/* Finalidades */}
            <section>
              <h2 className="text-xl font-bold mb-3">3. Finalidades do Tratamento de Dados</h2>
              <p className="text-gray-700 mb-2">Seus dados pessoais são coletados e tratados para as seguintes finalidades:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Gestão de distribuição de cestas básicas:</strong> Cadastro e identificação das famílias beneficiárias</li>
                <li><strong>Controle de entregas:</strong> Registro de entregas e prevenção de duplicidade de benefícios</li>
                <li><strong>Sistema de bloqueio temporário:</strong> Garantir distribuição equitativa entre as famílias</li>
                <li><strong>Geração de relatórios estatísticos:</strong> Análise de impacto e efetividade do programa</li>
                <li><strong>Geração de recibos:</strong> Comprovação de entrega de cestas básicas</li>
                <li><strong>Cumprimento de obrigações legais:</strong> Atendimento a requisições de órgãos públicos</li>
                <li><strong>Execução de políticas públicas:</strong> Assistência social e combate à insegurança alimentar</li>
              </ul>
            </section>

            {/* Bases Legais */}
            <section>
              <h2 className="text-xl font-bold mb-3">4. Bases Legais (Art. 7º da LGPD)</h2>
              <p className="text-gray-700 mb-2">O tratamento de seus dados pessoais é fundamentado nas seguintes bases legais:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Consentimento (Art. 7º, I):</strong> Mediante sua autorização expressa</li>
                <li><strong>Execução de políticas públicas (Art. 7º, III):</strong> Distribuição de cestas básicas como política de assistência social</li>
                <li><strong>Proteção da vida (Art. 7º, VII):</strong> Garantir alimentação adequada</li>
                <li><strong>Tutela da saúde (Art. 7º, VIII):</strong> Nutrição e segurança alimentar</li>
              </ul>
            </section>

            {/* Compartilhamento */}
            <section>
              <h2 className="text-xl font-bold mb-3">5. Compartilhamento de Dados</h2>
              <p className="text-gray-700 mb-2">Seus dados pessoais podem ser compartilhados com:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Instituições parceiras:</strong> Para coordenação da distribuição de cestas básicas</li>
                <li><strong>Autoridades públicas:</strong> Quando exigido por lei ou determinação judicial</li>
                <li><strong>Órgãos de controle:</strong> Para fiscalização e auditoria de políticas públicas</li>
              </ul>
              <p className="text-gray-700 mt-2">
                <strong>Importante:</strong> Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros 
                para fins comerciais ou publicitários.
              </p>
            </section>

            {/* Direitos do Titular */}
            <section>
              <h2 className="text-xl font-bold mb-3">6. Seus Direitos como Titular (Art. 18 da LGPD)</h2>
              <p className="text-gray-700 mb-2">Você tem os seguintes direitos garantidos pela LGPD:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>I - Confirmação da existência de tratamento:</strong> Saber se tratamos seus dados</li>
                <li><strong>II - Acesso aos dados:</strong> Obter cópia de seus dados pessoais</li>
                <li><strong>III - Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li><strong>IV - Anonimização, bloqueio ou eliminação:</strong> De dados desnecessários, excessivos ou tratados em desconformidade</li>
                <li><strong>V - Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>VI - Eliminação:</strong> Excluir dados tratados com seu consentimento</li>
                <li><strong>VII - Informação sobre compartilhamento:</strong> Saber com quem compartilhamos seus dados</li>
                <li><strong>VIII - Informação sobre não consentimento:</strong> Conhecer as consequências da negativa</li>
                <li><strong>IX - Revogação do consentimento:</strong> Retirar seu consentimento a qualquer momento</li>
              </ul>
            </section>

            {/* Segurança */}
            <section>
              <h2 className="text-xl font-bold mb-3">7. Segurança e Proteção de Dados</h2>
              <p className="text-gray-700 mb-2">Adotamos medidas técnicas e organizacionais para proteger seus dados:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Criptografia:</strong> Dados sensíveis como CPF são criptografados</li>
                <li><strong>Controle de acesso:</strong> Sistema de permissões baseado em funções (admin/instituição)</li>
                <li><strong>Row Level Security (RLS):</strong> Isolamento de dados no banco de dados</li>
                <li><strong>Senhas protegidas:</strong> Armazenamento seguro com hash bcrypt</li>
                <li><strong>Armazenamento seguro:</strong> Documentos em buckets privados com URLs temporárias</li>
                <li><strong>Logs de auditoria:</strong> Registro de todas as operações críticas</li>
                <li><strong>Backups regulares:</strong> Proteção contra perda de dados</li>
              </ul>
            </section>

            {/* Retenção */}
            <section>
              <h2 className="text-xl font-bold mb-3">8. Retenção de Dados</h2>
              <p className="text-gray-700">
                Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades descritas, 
                ou conforme exigido por lei. Após esse período, os dados são eliminados ou anonimizados.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
                <li><strong>Dados cadastrais:</strong> Enquanto houver vínculo ativo com o programa</li>
                <li><strong>Histórico de entregas:</strong> 5 anos após última entrega (para fins estatísticos e prestação de contas)</li>
                <li><strong>Dados anonimizados:</strong> Podem ser mantidos indefinidamente para fins estatísticos</li>
              </ul>
            </section>

            {/* DPO */}
            <section>
              <h2 className="text-xl font-bold mb-3">9. Encarregado de Proteção de Dados (DPO)</h2>
              <p className="text-gray-700 mb-2">
                Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de seus dados pessoais, 
                entre em contato com nosso Encarregado de Proteção de Dados:
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mt-3">
                <p className="font-semibold">Contato do DPO:</p>
                <p className="text-gray-700">Email: <a href="mailto:dpo@cestacontrolhub.com.br" className="text-blue-600 underline">dpo@cestacontrolhub.com.br</a></p>
                <p className="text-gray-700">Telefone: (34) 99999-0000</p>
                <p className="text-gray-700 text-sm mt-2">Prazo de resposta: até 15 dias úteis</p>
              </div>
            </section>

            {/* Incidentes */}
            <section>
              <h2 className="text-xl font-bold mb-3">10. Comunicação de Incidentes de Segurança</h2>
              <p className="text-gray-700">
                Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, 
                comunicaremos o ocorrido à Autoridade Nacional de Proteção de Dados (ANPD) e aos titulares afetados, 
                conforme determinado pela LGPD (Art. 48).
              </p>
            </section>

            {/* Alterações */}
            <section>
              <h2 className="text-xl font-bold mb-3">11. Alterações nesta Política</h2>
              <p className="text-gray-700">
                Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossas 
                práticas ou na legislação. Recomendamos que você revise esta página regularmente. 
                A data da última atualização está indicada no início deste documento.
              </p>
            </section>

            {/* Legislação */}
            <section>
              <h2 className="text-xl font-bold mb-3">12. Legislação Aplicável</h2>
              <p className="text-gray-700">
                Esta Política de Privacidade é regida pela legislação brasileira, em especial pela 
                Lei nº 13.709/2018 (Lei Geral de Proteção de Dados - LGPD) e pela Lei nº 12.965/2014 
                (Marco Civil da Internet).
              </p>
            </section>

            {/* Links Úteis */}
            <section className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-3">Links Úteis</h2>
              <ul className="space-y-2 text-gray-700">
                <li>
                  <strong>ANPD - Autoridade Nacional de Proteção de Dados:</strong>{' '}
                  <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    www.gov.br/anpd
                  </a>
                </li>
                <li>
                  <strong>Texto completo da LGPD:</strong>{' '}
                  <a href="http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    Lei nº 13.709/2018
                  </a>
                </li>
              </ul>
            </section>

            {/* Consentimento */}
            <section className="border-t pt-6 mt-6">
              <p className="text-sm text-gray-600 italic text-center">
                Ao utilizar o sistema Cesta Control Hub e fornecer seus dados pessoais, 
                você declara ter lido, compreendido e concordado com esta Política de Privacidade.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

